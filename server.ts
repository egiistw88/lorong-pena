import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'node:crypto';

// Inisialisasi Google GenAI dengan GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Audio Cache (Key: MD5(text + voice + rate) -> WAV Buffer)
const audioCache = new Map<string, { buffer: Buffer; createdAt: number }>();
const MAX_CACHE_ITEMS = 600;

const serverStartTime = Date.now();

interface TTSTransactionRecord {
  id: string;
  timestamp: number;
  textPreview: string;
  source: 'cache' | 'gemini-api' | 'silent';
  model?: string;
  durationMs: number;
  success: boolean;
  status: number;
  errorNote?: string;
}

interface RateLimitTracker {
  isLimited: boolean;
  exceededAt?: number;
  retryDelaySeconds?: number;
  retryAt?: number;
  message?: string;
  quotaMetric?: string;
  quotaId?: string;
  limitValue?: string;
}

// Telemetri dan Pelacakan Kuota Gemini Asli
const ttsTelemetry = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  apiSuccesses: 0,
  apiFailures: 0,
  totalLatencyMs: 0,
  lastLatencyMs: 0,
  lastRequestTimestamp: null as number | null,
  activeModel: 'gemini-2.5-flash-preview-tts',
  candidateModels: ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'],
  rateLimit: {
    isLimited: false,
  } as RateLimitTracker,
  recentTransactions: [] as TTSTransactionRecord[],
};

function recordTransaction(tx: Omit<TTSTransactionRecord, 'id'>) {
  const record: TTSTransactionRecord = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  ttsTelemetry.recentTransactions.unshift(record);
  if (ttsTelemetry.recentTransactions.length > 12) {
    ttsTelemetry.recentTransactions.pop();
  }
}

function getCacheKey(text: string, voice: string, rate: number): string {
  return crypto.createHash('md5').update(`${voice}_${rate.toFixed(2)}_${text.trim()}`).digest('hex');
}

/**
 * Konversi Linear PCM 16-bit Mono (dari Gemini TTS) ke format WAV standar
 * dengan micro-fade ramp untuk menghilangkan letupan (pop/click) pada speaker.
 */
function smoothPcmBuffer(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  if (pcmBuffer.length < 4) return pcmBuffer;
  const copy = Buffer.from(pcmBuffer);
  const totalSamples = Math.floor(copy.length / 2);

  // Micro fade-in 2.5ms (60 sampel pada 24kHz)
  const fadeInSamples = Math.min(60, Math.floor(totalSamples / 4));
  for (let i = 0; i < fadeInSamples; i++) {
    const factor = i / fadeInSamples;
    const sample = copy.readInt16LE(i * 2);
    copy.writeInt16LE(Math.round(sample * factor), i * 2);
  }

  // Micro fade-out 4ms (96 sampel pada 24kHz)
  const fadeOutSamples = Math.min(96, Math.floor(totalSamples / 4));
  for (let i = 0; i < fadeOutSamples; i++) {
    const factor = i / fadeOutSamples;
    const sampleIndex = totalSamples - 1 - i;
    const sample = copy.readInt16LE(sampleIndex * 2);
    copy.writeInt16LE(Math.round(sample * factor), sampleIndex * 2);
  }

  return copy;
}

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const smoothedPcm = smoothPcmBuffer(pcmBuffer, sampleRate);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + smoothedPcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // 1 = Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(smoothedPcm.length, 40);

  return Buffer.concat([header, smoothedPcm]);
}

function createSilentWav(durationSeconds = 0.5, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const pcmBuffer = Buffer.alloc(numSamples * 2); // 0 bytes = silent PCM
  return pcmToWav(pcmBuffer, sampleRate, 1, 16);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      cacheSize: audioCache.size,
    });
  });

  // 2. Daftar suara narator Gemini yang tersedia
  app.get('/api/tts/voices', (_req, res) => {
    res.json({
      voices: [
        {
          id: 'Charon',
          name: 'Charon',
          gender: 'Pria',
          deskripsi: 'Suara dalam, tenang, dan berwibawa. Sangat cocok untuk narasi kisah hidup dan novel reflektif.',
          default: true,
        },
        {
          id: 'Kore',
          name: 'Kore',
          gender: 'Wanita',
          deskripsi: 'Suara lembut, jernih, dan penuh penghayatan emosional.',
          default: false,
        },
        {
          id: 'Zephyr',
          name: 'Zephyr',
          gender: 'Pria',
          deskripsi: 'Suara teduh, mengalir tenang, artikulasi santai.',
          default: false,
        },
        {
          id: 'Puck',
          name: 'Puck',
          gender: 'Pria',
          deskripsi: 'Suara ekspresif, lincah, dinamis untuk dialog.',
          default: false,
        },
        {
          id: 'Fenrir',
          name: 'Fenrir',
          gender: 'Pria',
          deskripsi: 'Suara tegas, berbobot, dan menggelegar.',
          default: false,
        },
      ],
    });
  });

  // 3. Endpoint Monitor Real-Time Status & Kuota Gemini Asli
  app.get('/api/tts/status', (_req, res) => {
    const totalReq = ttsTelemetry.totalRequests;
    const cacheHits = ttsTelemetry.cacheHits;
    const cacheHitRate = totalReq > 0 ? Math.round((cacheHits / totalReq) * 100) : 0;
    const avgLatency =
      ttsTelemetry.apiSuccesses > 0
        ? Math.round(ttsTelemetry.totalLatencyMs / ttsTelemetry.apiSuccesses)
        : ttsTelemetry.lastLatencyMs;

    // Evaluasi status nyata
    let overallStatus: 'online' | 'rate_limited' | 'error' | 'no_key' = 'online';
    if (!ai) {
      overallStatus = 'no_key';
    } else if (ttsTelemetry.rateLimit.isLimited) {
      // Cek apakah jeda retry sudah lewat
      if (ttsTelemetry.rateLimit.retryAt && Date.now() > ttsTelemetry.rateLimit.retryAt) {
        ttsTelemetry.rateLimit.isLimited = false;
        overallStatus = 'online';
      } else {
        overallStatus = 'rate_limited';
      }
    }

    res.json({
      status: overallStatus,
      hasApiKey: Boolean(ai),
      activeModel: ttsTelemetry.activeModel,
      candidateModels: ttsTelemetry.candidateModels,
      cacheSize: audioCache.size,
      maxCacheSize: MAX_CACHE_ITEMS,
      metrics: {
        totalRequests: ttsTelemetry.totalRequests,
        cacheHits: ttsTelemetry.cacheHits,
        cacheMisses: ttsTelemetry.cacheMisses,
        apiCalls: ttsTelemetry.apiCalls,
        apiSuccesses: ttsTelemetry.apiSuccesses,
        apiFailures: ttsTelemetry.apiFailures,
        cacheHitRatePercent: cacheHitRate,
        lastLatencyMs: ttsTelemetry.lastLatencyMs,
        averageLatencyMs: avgLatency,
        lastRequestTime: ttsTelemetry.lastRequestTimestamp,
      },
      rateLimitInfo: ttsTelemetry.rateLimit.isLimited ? ttsTelemetry.rateLimit : null,
      recentTransactions: ttsTelemetry.recentTransactions,
      serverUptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    });
  });

  // 4. Endpoint Pengujian Koneksi Live (Ping) ke Gemini API
  app.post('/api/tts/test-connection', async (_req, res) => {
    if (!ai) {
      return res.status(503).json({
        ok: false,
        message: 'GEMINI_API_KEY belum terpasang di sistem.',
      });
    }

    const testStartTime = Date.now();
    try {
      const response = await ai.models.generateContent({
        model: ttsTelemetry.activeModel,
        contents: [{ parts: [{ text: 'Uji koneksi audio.' }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const hasAudio = Boolean(part?.inlineData?.data);
      const latency = Date.now() - testStartTime;

      if (hasAudio) {
        ttsTelemetry.rateLimit.isLimited = false;
        res.json({
          ok: true,
          latencyMs: latency,
          model: ttsTelemetry.activeModel,
          message: `Koneksi Gemini TTS prima (${latency}ms). Audio 24kHz berhasil disintesis.`,
        });
      } else {
        res.status(502).json({
          ok: false,
          latencyMs: latency,
          model: ttsTelemetry.activeModel,
          message: 'Model merespons namun data audio tidak ditemukan.',
        });
      }
    } catch (err: any) {
      const latency = Date.now() - testStartTime;
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes('429') ||
        err.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit) {
        ttsTelemetry.rateLimit.isLimited = true;
        ttsTelemetry.rateLimit.message = err.message?.slice(0, 200);
      }

      res.status(isRateLimit ? 429 : 500).json({
        ok: false,
        latencyMs: latency,
        model: ttsTelemetry.activeModel,
        error: err.message || 'Gagal menghubungi Gemini API',
      });
    }
  });

  // 5. Endpoint Bersihkan Cache Memori Audio Server
  app.post('/api/tts/clear-cache', (_req, res) => {
    const previousSize = audioCache.size;
    audioCache.clear();
    res.json({
      success: true,
      clearedItems: previousSize,
      message: `Cache audio server (${previousSize} item) berhasil dikosongkan.`,
    });
  });

  // 6. Sintesis Suara Gemini TTS Sisi Server
  app.post('/api/tts/synthesize', async (req, res) => {
    const requestStartTime = Date.now();
    ttsTelemetry.totalRequests += 1;
    ttsTelemetry.lastRequestTimestamp = requestStartTime;

    try {
      const { text, voice = 'Charon', rate = 1.0, isDialogue = false } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Parameter text diperlukan' });
      }

      const cleanText = text.trim();
      const textPreview = cleanText.length > 55 ? `${cleanText.slice(0, 52)}...` : cleanText;
      const selectedVoice = ['Charon', 'Kore', 'Zephyr', 'Puck', 'Fenrir'].includes(voice)
        ? voice
        : 'Charon';

      const cacheKey = getCacheKey(cleanText, selectedVoice, rate);
      const cached = audioCache.get(cacheKey);

      // Cache HIT: respon instan dalam <2ms
      if (cached) {
        ttsTelemetry.cacheHits += 1;
        const duration = Date.now() - requestStartTime;
        recordTransaction({
          timestamp: requestStartTime,
          textPreview,
          source: 'cache',
          model: 'In-Memory Cache',
          durationMs: duration,
          success: true,
          status: 200,
        });

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Audio-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(cached.buffer);
      }

      ttsTelemetry.cacheMisses += 1;

      // Bersihkan teks untuk artikulasi sastra yang jernih dan bebas noise
      const spokenText = cleanText
        .replace(/[•\*\-–—]{2,}/g, ' ')
        .replace(/[\u201C\u201D"']/g, '')
        .replace(/—/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();

      // Jika teks hanya berupa simbol atau pemisah adegan tanpa kata/angka
      if (!/[a-zA-Z0-9]/.test(spokenText)) {
        const silentWav = createSilentWav(0.6);
        audioCache.set(cacheKey, { buffer: silentWav, createdAt: Date.now() });
        const duration = Date.now() - requestStartTime;
        recordTransaction({
          timestamp: requestStartTime,
          textPreview: '• • • (Pemisah Adegan)',
          source: 'silent',
          model: 'Silent Waveform',
          durationMs: duration,
          success: true,
          status: 200,
        });

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Audio-Cache', 'SILENT');
        return res.send(silentWav);
      }

      if (!ai) {
        recordTransaction({
          timestamp: requestStartTime,
          textPreview,
          source: 'gemini-api',
          durationMs: Date.now() - requestStartTime,
          success: false,
          status: 503,
          errorNote: 'GEMINI_API_KEY tidak ada',
        });
        return res.status(503).json({
          error: 'GEMINI_API_KEY belum terpasang di server',
          fallback: 'web-speech',
        });
      }

      // Model cascade: coba gemini-2.5-flash-preview-tts dulu, lalu gemini-3.1-flash-tts-preview
      const candidateModels = ttsTelemetry.candidateModels;

      let base64Pcm: string | undefined;
      let usedModel = candidateModels[0];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        ttsTelemetry.apiCalls += 1;
        try {
          const apiCallStart = Date.now();
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: spokenText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0];
          base64Pcm = part?.inlineData?.data;
          if (base64Pcm) {
            usedModel = modelName;
            ttsTelemetry.activeModel = modelName;
            ttsTelemetry.apiSuccesses += 1;
            const apiLatency = Date.now() - apiCallStart;
            ttsTelemetry.lastLatencyMs = apiLatency;
            ttsTelemetry.totalLatencyMs += apiLatency;
            ttsTelemetry.rateLimit.isLimited = false;
            break;
          }
        } catch (err: any) {
          lastError = err;
          ttsTelemetry.apiFailures += 1;

          const isRateLimit =
            err.status === 429 ||
            err.message?.includes('429') ||
            err.message?.includes('RESOURCE_EXHAUSTED') ||
            err.message?.includes('quota');

          if (isRateLimit) {
            // Ekstrak informasi retry delay asli dari error Gemini jika ada
            let retrySec = 60;
            const match = err.message?.match(/retry in ([0-9.]+)s/i);
            if (match && match[1]) {
              retrySec = Math.ceil(parseFloat(match[1]));
            }

            ttsTelemetry.rateLimit = {
              isLimited: true,
              exceededAt: Date.now(),
              retryDelaySeconds: retrySec,
              retryAt: Date.now() + retrySec * 1000,
              message: err.message?.slice(0, 250),
              quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests',
              quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
              limitValue: '10 RPD (Free Tier)',
            };
            console.warn(`Model ${modelName} terkena limit kuota Gemini, mencoba model alternatif...`);
            continue;
          } else {
            console.warn(`Model ${modelName} error:`, err.message?.slice(0, 100));
            continue;
          }
        }
      }

      const totalProcessingTime = Date.now() - requestStartTime;

      if (!base64Pcm) {
        const isQuota =
          lastError?.status === 429 ||
          lastError?.message?.includes('429') ||
          lastError?.message?.includes('RESOURCE_EXHAUSTED') ||
          lastError?.message?.includes('quota');

        recordTransaction({
          timestamp: requestStartTime,
          textPreview,
          source: 'gemini-api',
          model: usedModel,
          durationMs: totalProcessingTime,
          success: false,
          status: isQuota ? 429 : 502,
          errorNote: isQuota ? 'Batas kuota Gemini tercapai' : lastError?.message?.slice(0, 80),
        });

        if (isQuota) {
          return res.status(429).json({
            error: 'Batas kuota Gemini TTS tercapai',
            fallback: 'web-speech',
            retryAfter: ttsTelemetry.rateLimit.retryDelaySeconds,
          });
        }

        return res.status(502).json({
          error: lastError?.message || 'Gagal menerima data audio dari model Gemini TTS',
          fallback: 'web-speech',
        });
      }

      // Decode base64 PCM menjadi Buffer
      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      // Format WAV 24000 Hz, 16-bit, 1 channel dengan micro-smoothing
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

      // Simpan ke Cache
      if (audioCache.size >= MAX_CACHE_ITEMS) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, { buffer: wavBuffer, createdAt: Date.now() });

      recordTransaction({
        timestamp: requestStartTime,
        textPreview,
        source: 'gemini-api',
        model: usedModel,
        durationMs: totalProcessingTime,
        success: true,
        status: 200,
      });

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Audio-Cache', 'MISS');
      res.setHeader('X-Gemini-Model', usedModel);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(wavBuffer);
    } catch (error: any) {
      console.warn('Gemini TTS synthesis caught error:', error.message?.slice(0, 150));
      recordTransaction({
        timestamp: requestStartTime,
        textPreview: 'Error sintesis',
        source: 'gemini-api',
        durationMs: Date.now() - requestStartTime,
        success: false,
        status: 500,
        errorNote: error.message?.slice(0, 80),
      });

      res.status(500).json({
        error: error.message || 'Terjadi kesalahan saat sintesis suara',
        fallback: 'web-speech',
      });
    }
  });

  // Vite middleware untuk development vs static file untuk production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Lorong Pena berjalan di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
