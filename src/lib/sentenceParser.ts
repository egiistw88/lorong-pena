/**
 * Parser kalimat untuk kebutuhan Text-to-Speech (TTS) dan highlight karaoke halus.
 * Memisahkan teks narasi menjadi potongan kalimat alami dengan mempertahankan tanda petik dan dialog,
 * serta menyiapkan metadata prosodi (jeda napas, dialog tokoh, pemisah adegan) agar terdengar seperti pendongeng manusia.
 */

export interface SentenceUnit {
  id: string; // e.g. "sent-0-1-2" (sceneIndex-paragraphIndex-sentenceIndex)
  sceneIndex: number;
  paragraphIndex: number;
  sentenceIndex: number;
  text: string;
  cleanSpokenText: string;
  isDialogue: boolean;
  isParagraphEnd: boolean;
  isSceneEnd: boolean;
}

/**
 * Membersihkan dan menormalisasi teks untuk sintesis suara agar bebas dari pelafalan
 * tanda baca harfiah oleh mesin peramban (misal membaca "dash" atau "tanda kutip"),
 * sembari menjaga irama napas yang natural.
 */
export function sanitizeStorytellerSpeech(rawText: string): string {
  let cleaned = rawText.trim();

  // Em-dash panjang (—) dan double dash (--) diganti dengan koma jeda napas
  cleaned = cleaned.replace(/—/g, ', ');
  cleaned = cleaned.replace(/--/g, ', ');

  // Elipsis (...) diganti dengan jeda santai
  cleaned = cleaned.replace(/\.{3,}|…/g, ', ');

  // Singkirkan tanda petik luar agar suara peramban tidak mengucapkan "tanda kutip buka/tutup"
  cleaned = cleaned.replace(/^[“"']+|[”"']+$/g, '');

  // Rapikan spasi ganda yang mungkin timbul
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Memecah satu paragraf menjadi array kalimat alami.
 */
export function splitParagraphIntoSentences(paragraph: string): string[] {
  const text = paragraph.trim();
  if (!text) return [];

  const parts: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    const char = text[i];
    const isPunctuation = char === '.' || char === '!' || char === '?';

    if (isPunctuation) {
      // Periksa apakah tanda baca diikuti tanda petik penutup (misal: ." atau ?”)
      let nextIdx = i + 1;
      while (
        nextIdx < text.length &&
        (text[nextIdx] === '"' || text[nextIdx] === '”' || text[nextIdx] === "'" || text[nextIdx] === '’')
      ) {
        current += text[nextIdx];
        i = nextIdx;
        nextIdx++;
      }

      // Periksa apakah setelah tanda baca terdapat spasi yang memisahkan kalimat
      if (nextIdx < text.length && text[nextIdx] === ' ') {
        let lookahead = nextIdx + 1;
        while (lookahead < text.length && text[lookahead] === ' ') {
          lookahead++;
        }

        if (lookahead < text.length) {
          const nextChar = text[lookahead];
          // Jika karakter selanjutnya adalah huruf besar, tanda petik awal dialog, atau angka
          if (/[A-Z0-9"“'‘-]/.test(nextChar)) {
            parts.push(current.trim());
            current = '';
            i = nextIdx;
          }
        }
      }
    }
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Mengonversi seluruh adegan dan paragraf dalam sebuah UnitNarasi menjadi daftar linear SentenceUnit
 * dilengkapi metadata prosodi narasi untuk kualitas pendongeng cerita.
 */
export function extractSentencesFromUnit(
  unitId: string,
  adeganList: { paragraf: string[] }[]
): SentenceUnit[] {
  const results: SentenceUnit[] = [];

  adeganList.forEach((adegan, sceneIndex) => {
    const validParagraphs = adegan.paragraf.filter((p) => !p.startsWith('['));

    validParagraphs.forEach((paragraf, paragraphIndex) => {
      const sentenceStrings = splitParagraphIntoSentences(paragraf);
      const isParagraphEnd = paragraphIndex === validParagraphs.length - 1;

      sentenceStrings.forEach((sentenceText, sentenceIndex) => {
        if (sentenceText.trim().length > 0) {
          const isLastSentenceInParagraph = sentenceIndex === sentenceStrings.length - 1;
          const isSceneEnd = isParagraphEnd && isLastSentenceInParagraph;

          // Deteksi apakah kalimat adalah dialog tokoh
          const trimmed = sentenceText.trim();
          const isDialogue =
            trimmed.startsWith('“') ||
            trimmed.startsWith('"') ||
            trimmed.includes('”') ||
            trimmed.includes('"') ||
            /["“][^"”]+["”]/.test(trimmed);

          results.push({
            id: `sent-${unitId}-${sceneIndex}-${paragraphIndex}-${sentenceIndex}`,
            sceneIndex,
            paragraphIndex,
            sentenceIndex,
            text: sentenceText,
            cleanSpokenText: sanitizeStorytellerSpeech(sentenceText),
            isDialogue,
            isParagraphEnd: isLastSentenceInParagraph,
            isSceneEnd,
          });
        }
      });
    });
  });

  return results;
}
