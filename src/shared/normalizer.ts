/**
 * Normalization utilities for question and answer matching
 */

/**
 * Remove HTML tags from string
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Remove common prefixes like 'A.', 'B.', 'A)', 'Câu 1:', 'Question 1:'
 */
export function stripOptionPrefix(input: string): string {
  if (!input) return "";
  return input
    .replace(/^[\s\-_•*]*([A-Za-z][\.\)\:\-]|[0-9]+[\)\:\-]|[0-9]+\.)\s+/i, "")
    .replace(/^(câu|cau|question)\s*\d+[\:\.\-]?\s*/i, "")
    .trim();
}

/**
 * Remove math LaTeX wraps if present, e.g. \( ... \) or $ ... $
 */
export function cleanLatex(input: string): string {
  if (!input) return "";
  return input
    .replace(/\\\((.*?)\\\)/g, "$1")
    .replace(/\$\$(.*?)\$\$/g, "$1")
    .replace(/\$(.*?)\$/g, "$1")
    .replace(/\\times/g, "x")
    .replace(/\\cdot/g, "x")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
}

/**
 * Standard text normalization for comparison
 */
export function normalizeText(input: string, stripPrefix: boolean = true): string {
  if (!input) return "";
  let text = stripHtml(input);
  text = cleanLatex(text);
  if (stripPrefix) {
    text = stripOptionPrefix(text);
  }
  return text
    .toLowerCase()
    .normalize("NFC") // Standard Unicode normalization
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[“”"']/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[.,;:?!]/g, " ") // replace punctuation with spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

/**
 * Remove Vietnamese accents for fallback loose matching
 */
export function removeAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * N-gram (trigram / bigram) Jaccard similarity between two strings
 */
export function calculateNgramSimilarity(s1: string, s2: string, n: number = 2): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  if (s1.length < n || s2.length < n) {
    return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0.0;
  }

  const getGrams = (text: string) => {
    const grams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      grams.add(text.substring(i, i + n));
    }
    return grams;
  };

  const grams1 = getGrams(s1);
  const grams2 = getGrams(s2);

  let intersection = 0;
  for (const gram of grams1) {
    if (grams2.has(gram)) {
      intersection++;
    }
  }

  const union = grams1.size + grams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Token overlap / Jaccard similarity for words
 */
export function calculateTokenSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const words1 = new Set(s1.split(" ").filter((w) => w.length > 0));
  const words2 = new Set(s2.split(" ").filter((w) => w.length > 0));

  if (words1.size === 0 || words2.size === 0) return 0;

  let common = 0;
  for (const w of words1) {
    if (words2.has(w)) common++;
  }

  const total = words1.size + words2.size - common;
  return total === 0 ? 0 : common / total;
}

/**
 * Combined high-accuracy similarity score (0 to 100%)
 */
export function computeSimilarityScore(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  // Exact match
  if (norm1 === norm2) return 100;
  if (!norm1 || !norm2) return 0;

  // Substring containment
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    const ratio = minLen / maxLen;
    if (ratio > 0.8) return Math.round(92 + ratio * 8);
  }

  // Token Jaccard + N-gram blended
  const tokenSim = calculateTokenSimilarity(norm1, norm2);
  const ngramSim = calculateNgramSimilarity(norm1, norm2, 2);

  const blended = tokenSim * 0.5 + ngramSim * 0.5;

  // Also check accent-free if blended is moderate
  const accentFree1 = removeAccents(norm1);
  const accentFree2 = removeAccents(norm2);
  let accentBonus = 0;
  if (accentFree1 === accentFree2) {
    accentBonus = 0.95;
  }

  const finalScore = Math.max(blended, accentBonus);
  return Math.round(Math.min(100, Math.max(0, finalScore * 100)));
}
