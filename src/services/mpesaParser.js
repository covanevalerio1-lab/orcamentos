const AMOUNT_REGEX = /([\d]{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?)\s*MT/i;
const DATE_REGEX = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

const TYPE_KEYWORDS = [
  { keywords: ["transferiu", "enviou", "pagou", "levantou", "levantamento"], type: "saida" },
  { keywords: ["recebeu", "depositou", "deposito"], type: "entrada" },
];

function parseAmount(text) {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;
  let raw = match[1].replace(/\s/g, "");
  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function parseDate(text) {
  const match = text.match(DATE_REGEX);
  if (!match) return new Date();
  let [, day, month, year] = match;
  if (year.length === 2) year = `20${year}`;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function parseType(text) {
  const lower = text.toLowerCase();
  for (const { keywords, type } of TYPE_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return "saida";
}

function parseRecipient(text) {
  const match = text.match(/(?:para|a|de)\s+([A-ZÀ-Ú][\wÀ-ú'.-]+(?:\s+[A-ZÀ-Ú][\wÀ-ú'.-]+){0,3})/);
  return match ? match[1].trim() : null;
}

export function parseMpesaSms(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const text = rawText.trim();
  const looksLikeMpesa = /confirmado|m-?pesa/i.test(text);
  const amount = parseAmount(text);
  if (!looksLikeMpesa || amount === null) return null;
  return {
    amount,
    type: parseType(text),
    date: parseDate(text),
    recipient: parseRecipient(text),
    rawText: text,
  };
}
