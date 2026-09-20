/**
 * scripts/generate-audio.ts
 *
 * Offline audio generation for Lorong Pena.
 *
 * IMPORTANT:
 * - This script is for local/manual execution only.
 * - It is never imported by the web app.
 * - It writes generated MP3 files to public/audio/<unit-id>/.
 * - It keeps a manifest per unit so unchanged sentences are not billed again.
 * - The manifest also tracks voice/configuration, so changing voice forces
 *   regeneration instead of accidentally reusing audio made with another voice.
 *
 * Examples:
 *   npm run audio:generate -- --dry-run
 *   npm run audio:generate -- --unit=bab-1-1 --dry-run
 *   npm run audio:generate -- --unit=bab-1-1 --voice=id-ID-Chirp3-HD-Charon
 *   npm run audio:generate -- --prune
 *   npm run audio:generate -- --force
 *
 * Authentication (Google Application Default Credentials):
 *   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/credentials.json"
 *
 * Keep credentials.json out of Git. .gitignore is configured for common
 * Google service-account key filenames.
 */

import { createHash, createSign } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_UNITS } from '../src/content/units/index';
import { extractSentencesFromUnit, SentenceUnit } from '../src/lib/sentenceParser';

const AUDIO_ROOT = join(process.cwd(), 'public', 'audio');
const DEFAULT_VOICE = 'id-ID-Chirp3-HD-Charon';
const LANGUAGE_CODE = 'id-ID';
const AUDIO_ENCODING = 'MP3';

// Chirp 3: HD pricing is currently US$30 / 1M characters after the free tier.
// This is an estimate only; Google Cloud billing remains authoritative.
const PRICE_PER_MILLION_CHARS_USD = 30;
const FREE_CHARACTERS_PER_MONTH = 1_000_000;
const DEFAULT_REQUEST_DELAY_MS = 150;
const DEFAULT_MAX_RETRIES = 3;
const MANIFEST_VERSION = 2;

interface ManifestEntry {
  textHash: string;
  voice: string;
  languageCode: string;
  audioEncoding: string;
  file: string;
}

type Manifest = Record<string, ManifestEntry>;

interface PlannedSentence {
  unitId: string;
  sentence: SentenceUnit;
  hash: string;
  file: string;
}

interface CliOptions {
  dryRun: boolean;
  force: boolean;
  prune: boolean;
  unitFilter?: string;
  voice: string;
  delayMs: number;
  maxRetries: number;
}

function printHelp(): void {
  console.log(`
Lorong Pena — Offline Google Cloud TTS generator

Usage:
  npm run audio:generate -- [options]

Options:
  --dry-run      Hitung rencana/karakter/biaya tanpa memanggil Google TTS.
  --unit=<id>    Hanya proses satu unit, misalnya bab-1-1.
  --voice=<name> Voice Google Cloud TTS yang digunakan.
  --force        Generate ulang semua kalimat yang terpilih.
  --prune        Hapus MP3/manifest entry yang tidak lagi berasal dari naskah.
  --delay=<ms>   Jeda antar-request API. Default: ${DEFAULT_REQUEST_DELAY_MS}.
  --retries=<n>  Maksimum percobaan per kalimat. Default: ${DEFAULT_MAX_RETRIES}.
  --help         Tampilkan bantuan ini.

Examples:
  npm run audio:generate -- --dry-run
  npm run audio:generate -- --unit=bab-1-1 --dry-run
  npm run audio:generate -- --unit=bab-1-1 --voice=id-ID-Chirp3-HD-Charon
  npm run audio:generate -- --prune
`);
}

function parsePositiveInteger(value: string, flag: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} harus berupa bilangan bulat >= 0.`);
  }
  return parsed === 0 ? fallback : parsed;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const getValue = (prefix: string): string | undefined =>
    argv.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1);

  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    prune: argv.includes('--prune'),
    unitFilter: getValue('--unit'),
    voice: getValue('--voice') ?? DEFAULT_VOICE,
    delayMs: parsePositiveInteger(
      getValue('--delay') ?? String(DEFAULT_REQUEST_DELAY_MS),
      '--delay',
      DEFAULT_REQUEST_DELAY_MS,
    ),
    maxRetries: parsePositiveInteger(
      getValue('--retries') ?? String(DEFAULT_MAX_RETRIES),
      '--retries',
      DEFAULT_MAX_RETRIES,
    ),
  };
}

function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function manifestPath(unitDir: string): string {
  return join(unitDir, 'manifest.json');
}

function loadManifest(unitDir: string): Manifest {
  const path = manifestPath(unitDir);
  if (!existsSync(path)) return {};

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('manifest bukan object JSON');
    }

    const root = parsed as Record<string, unknown>;
    const source =
      root.entries && typeof root.entries === 'object' && !Array.isArray(root.entries)
        ? (root.entries as Record<string, unknown>)
        : root;

    const manifest: Manifest = {};
    for (const [id, value] of Object.entries(source)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const entry = value as Record<string, unknown>;

      // Manifest v1 used \`hash\`. Convert it lazily rather than silently trusting
      // it as current audio, because v2 also needs voice/configuration metadata.
      if (
        typeof entry.hash === 'string' &&
        typeof entry.file === 'string' &&
        !('textHash' in entry)
      ) {
        manifest[id] = {
          textHash: entry.hash,
          voice: '',
          languageCode: '',
          audioEncoding: '',
          file: entry.file,
        };
        continue;
      }

      if (
        typeof entry.textHash === 'string' &&
        typeof entry.voice === 'string' &&
        typeof entry.languageCode === 'string' &&
        typeof entry.audioEncoding === 'string' &&
        typeof entry.file === 'string'
      ) {
        manifest[id] = {
          textHash: entry.textHash,
          voice: entry.voice,
          languageCode: entry.languageCode,
          audioEncoding: entry.audioEncoding,
          file: entry.file,
        };
      }
    }

    return manifest;
  } catch (error) {
    console.warn(`  ⚠ manifest.json rusak di ${path}; dianggap kosong.`);
    console.warn(`    ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

function saveManifest(unitDir: string, manifest: Manifest): void {
  mkdirSync(unitDir, { recursive: true });
  const path = manifestPath(unitDir);
  const tempPath = `${path}.tmp`;
  const payload = {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    entries: manifest,
  };
  writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  renameSync(tempPath, path);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUsd(value: number): string {
  return `US$${value.toFixed(2)}`;
}

function buildPlan(
  units: typeof DEFAULT_UNITS,
  options: CliOptions,
): {
  plan: PlannedSentence[];
  skipped: number;
  totalChars: number;
  staleByUnit: Map<string, string[]>;
  manifests: Map<string, Manifest>;
} {
  const plan: PlannedSentence[] = [];
  let skipped = 0;
  let totalChars = 0;
  const staleByUnit = new Map<string, string[]>();
  const manifests = new Map<string, Manifest>();

  for (const unit of units) {
    const unitDir = join(AUDIO_ROOT, unit.id);
    const manifest = loadManifest(unitDir);
    manifests.set(unit.id, manifest);

    const sentences = extractSentencesFromUnit(unit.id, unit.adegan);
    const activeIds = new Set<string>();

    for (const sentence of sentences) {
      const hash = hashText(sentence.cleanSpokenText);
      const file = `${sentence.id}.mp3`;
      const audioFilePath = join(unitDir, file);
      activeIds.add(sentence.id);

      const existing = manifest[sentence.id];
      const current =
        !options.force &&
        existing?.textHash === hash &&
        existing.voice === options.voice &&
        existing.languageCode === LANGUAGE_CODE &&
        existing.audioEncoding === AUDIO_ENCODING &&
        existing.file === file &&
        existsSync(audioFilePath);

      if (current) {
        skipped++;
        continue;
      }

      totalChars += sentence.cleanSpokenText.length;
      plan.push({ unitId: unit.id, sentence, hash, file });
    }

    if (options.prune && existsSync(unitDir)) {
      const stale: string[] = [];
      for (const [sentenceId, entry] of Object.entries(manifest)) {
        if (!activeIds.has(sentenceId)) stale.push(entry.file);
      }
      for (const file of readdirSync(unitDir)) {
        if (file.endsWith('.mp3') && !activeIds.has(file.replace(/\.mp3$/, ''))) {
          stale.push(file);
        }
      }
      staleByUnit.set(unit.id, [...new Set(stale)]);
    }
  }

  return { plan, skipped, totalChars, staleByUnit, manifests };
}

function pruneUnit(
  unitId: string,
  staleFiles: string[],
  manifest: Manifest,
): number {
  if (staleFiles.length === 0) return 0;
  const unitDir = join(AUDIO_ROOT, unitId);
  let removed = 0;

  for (const file of staleFiles) {
    // Only remove files inside the expected unit directory. Never accept path
    // traversal from manifest contents.
    const safeFile = file.replace(/[^a-zA-Z0-9._-]/g, '_');
    const target = join(unitDir, safeFile);
    if (existsSync(target) && safeFile.endsWith('.mp3')) {
      unlinkSync(target);
      removed++;
    }
  }

  for (const [sentenceId, entry] of Object.entries(manifest)) {
    if (staleFiles.includes(entry.file)) delete manifest[sentenceId];
  }

  return removed;
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('resource exhausted') ||
    message.includes('rate limit') ||
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('deadline exceeded') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('internal')
  );
}

interface ServiceAccountCredentials {
  type?: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function readServiceAccountCredentials(): ServiceAccountCredentials {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS belum diset.\n' +
      'Contoh: export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/credentials.json"',
    );
  }
  if (!existsSync(path)) {
    throw new Error(`File credentials tidak ditemukan: ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `File credentials bukan JSON yang valid: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format credentials Google Cloud tidak valid.');
  }

  const credentials = parsed as Partial<ServiceAccountCredentials>;
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      'Credentials harus berupa service-account JSON dengan client_email dan private_key.',
    );
  }

  if (credentials.type && credentials.type !== 'service_account') {
    throw new Error(
      `Jenis credentials "${credentials.type}" belum didukung. Gunakan service-account JSON standar.`,
    );
  }

  return credentials as ServiceAccountCredentials;
}

class GoogleCloudTtsClient {
  private readonly credentials = readServiceAccountCredentials();
  private accessToken?: string;
  private tokenExpiresAt = 0;

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && now < this.tokenExpiresAt - 60) {
      return this.accessToken;
    }

    const tokenUri = this.credentials.token_uri ?? 'https://oauth2.googleapis.com/token';
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64Url(
      JSON.stringify({
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: tokenUri,
        iat: now,
        exp: now + 3600,
      }),
    );
    const unsignedToken = `${header}.${payload}`;

    const signer = createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signer.end();

    const signature = signer.sign(this.credentials.private_key).toString('base64url');
    const assertion = `${unsignedToken}.${signature}`;

    const response = await fetch(tokenUri, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`OAuth token request gagal (${response.status}): ${body.slice(0, 1000)}`);
    }

    const token = JSON.parse(body) as { access_token?: string; expires_in?: number };
    if (!token.access_token) {
      throw new Error('OAuth response tidak memuat access_token.');
    }

    this.accessToken = token.access_token;
    this.tokenExpiresAt = now + (token.expires_in ?? 3600);
    return token.access_token;
  }

  async synthesize(text: string, voice: string): Promise<Buffer> {
    const accessToken = await this.getAccessToken();
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANGUAGE_CODE, name: voice },
        audioConfig: { audioEncoding: AUDIO_ENCODING },
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Google TTS gagal (${response.status}): ${body.slice(0, 1200)}`);
    }

    const result = JSON.parse(body) as { audioContent?: string };
    if (!result.audioContent) {
      throw new Error('Respons Google TTS tidak memuat audioContent.');
    }

    return Buffer.from(result.audioContent, 'base64');
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const units = DEFAULT_UNITS.filter((unit) => !options.unitFilter || unit.id === options.unitFilter);

  if (options.unitFilter && units.length === 0) {
    console.error(`Unit dengan id "${options.unitFilter}" tidak ditemukan.`);
    console.error(`Unit tersedia: ${DEFAULT_UNITS.map((unit) => unit.id).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const { plan, skipped, totalChars, staleByUnit, manifests } = buildPlan(units, options);
  const billableCharsAfterFreeTier = Math.max(0, totalChars - FREE_CHARACTERS_PER_MONTH);
  const estimatedCost = (billableCharsAfterFreeTier / 1_000_000) * PRICE_PER_MILLION_CHARS_USD;
  const staleCount = [...staleByUnit.values()].reduce((sum, files) => sum + files.length, 0);

  console.log('\n── Lorong Pena · Rencana Generate Audio ───────────────');
  console.log(`Unit diproses       : ${units.length}`);
  console.log(`Kalimat dilewati    : ${skipped}`);
  console.log(`Kalimat digenerate  : ${plan.length}`);
  console.log(`Karakter baru       : ${totalChars.toLocaleString('id-ID')}`);
  console.log(`Estimasi setelah free tier: ${formatUsd(estimatedCost)}`);
  console.log(`Voice               : ${options.voice}`);
  console.log(`Delay               : ${options.delayMs} ms`);
  console.log(`Max retries         : ${options.maxRetries}`);
  console.log(`Force               : ${options.force ? 'YA' : 'tidak'}`);
  console.log(`Prune               : ${options.prune ? `YA (${staleCount} file)` : 'tidak'}`);
  console.log('───────────────────────────────────────────────────────\n');

  if (options.dryRun) {
    if (plan.length > 0) {
      console.log('Kalimat yang akan digenerate:');
      for (const [index, item] of plan.entries()) {
        console.log(`  ${index + 1}. ${item.unitId}/${item.file} — ${item.sentence.cleanSpokenText}`);
      }
    }
    console.log('\n[--dry-run] Tidak ada panggilan API dan tidak ada file yang diubah.');
    return;
  }

  if (plan.length === 0 && staleCount === 0) {
    console.log('Tidak ada pekerjaan. Audio sudah sinkron dengan naskah dan konfigurasi voice.');
    return;
  }

  const tts = new GoogleCloudTtsClient();
  let generated = 0;
  let failed = 0;
  let pruned = 0;

  // Prune only after planning succeeds. It is intentionally performed before
  // synthesis so obsolete files cannot be mistaken for valid output later.
  if (options.prune) {
    for (const unit of units) {
      const staleFiles = staleByUnit.get(unit.id) ?? [];
      const manifest = manifests.get(unit.id)!;
      const removed = pruneUnit(unit.id, staleFiles, manifest);
      if (removed > 0) {
        pruned += removed;
        saveManifest(join(AUDIO_ROOT, unit.id), manifest);
        console.log(`[prune] ${unit.id}: ${removed} file dihapus.`);
      }
    }
  }

  for (const [index, item] of plan.entries()) {
    const unitDir = join(AUDIO_ROOT, item.unitId);
    const outputPath = join(unitDir, item.file);
    const tempPath = `${outputPath}.tmp`;
    const manifest = manifests.get(item.unitId)!;

    mkdirSync(unitDir, { recursive: true });
    process.stdout.write(`[${index + 1}/${plan.length}] ${item.unitId}/${item.file} ... `);

    let success = false;
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        const audioContent = await tts.synthesize(
          item.sentence.cleanSpokenText,
          options.voice,
        );

        // Atomic-ish write: write temporary file first, then rename. A failed
        // process should not leave a half-written .mp3 that looks valid.
        writeFileSync(tempPath, audioContent);
        renameSync(tempPath, outputPath);

        manifest[item.sentence.id] = {
          textHash: item.hash,
          voice: options.voice,
          languageCode: LANGUAGE_CODE,
          audioEncoding: AUDIO_ENCODING,
          file: item.file,
        };
        saveManifest(unitDir, manifest);

        success = true;
        generated++;
        console.log('OK');
        break;
      } catch (error) {
        if (existsSync(tempPath)) unlinkSync(tempPath);
        const message = error instanceof Error ? error.message : String(error);
        const canRetry = attempt < options.maxRetries && isRetryableError(error);

        if (!canRetry) {
          console.error(`GAGAL: ${message}`);
          break;
        }

        const backoffMs = Math.min(30_000, options.delayMs * 2 ** attempt);
        console.warn(`retry ${attempt}/${options.maxRetries - 1} dalam ${backoffMs} ms (${message})`);
        await sleep(backoffMs);
      }
    }

    if (!success) {
      failed++;
      console.error('  → Dilewati. App tetap dapat menggunakan Web Speech API sebagai fallback.');
    }

    if (index < plan.length - 1) await sleep(options.delayMs);
  }

  console.log('\n── Selesai ────────────────────────────────────────────');
  console.log(`Berhasil digenerate : ${generated}`);
  console.log(`Gagal               : ${failed}`);
  console.log(`File di-prune       : ${pruned}`);
  console.log(`Output              : ${AUDIO_ROOT}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nSkrip berhenti karena error:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
