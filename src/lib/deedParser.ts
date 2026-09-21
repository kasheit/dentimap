import type { DeedType } from './types';

export interface ParsedDeedResult {
  recordingDate?: string;
  instrumentNumber?: string;
  book?: string;
  page?: string;
  grantor?: string;
  grantee?: string;
  consideration?: number;
  exciseTaxStamps?: number;
  deedType: DeedType;
  parcelPin?: string;
  isFormulaVerified: boolean;
  rawText: string;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const LABELS =
  'GRANTOR|GRANTEE|BOOK|BK|PAGE|PG|INSTRUMENT|INST|FILE|CONSIDERATION|SALE\\s*PRICE|EXCISE|STAMPS|PARCEL|PIN|RECORDED|REC(?:ORDING)?\\s*DATE|DATE|LEGAL|DOC(?:UMENT)?\\s*TYPE|TYPE';

const pad = (n: string | number) => String(n).padStart(2, '0');

export function normalizeDate(raw: string): string | undefined {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${pad(m[1])}-${pad(m[2])}`;
  }
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mi >= 0) return `${m[3]}-${pad(mi + 1)}-${pad(m[2])}`;
  }
  return undefined;
}

const DATE_VALUE = String.raw`(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})`;

function textField(text: string, label: string): string | undefined {
  const re = new RegExp(
    `(?:${label})S?\\s*[:#]?[ \\t]*([^\\n\\r\\t|]+?)(?=\\s*(?:\\b(?:${LABELS})\\b\\s*[:#]|\\||\\t|\\r|\\n|$))`,
    'i',
  );
  const m = text.match(re);
  return m ? m[1].trim().replace(/\s{2,}/g, ' ') : undefined;
}

function money(text: string, label: string): number | undefined {
  const m = text.match(new RegExp(`(?:${label})[^\\d$\\n]{0,12}\\$?\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)`, 'i'));
  return m ? parseFloat(m[1].replace(/,/g, '')) : undefined;
}

// NC G.S. 105-228.30: $1 per $500 of consideration, or fraction thereof.
export const expectedExcise = (consideration: number) => Math.ceil(consideration / 500);

export const checkExcise = (consideration: number, stamps: number) =>
  Math.abs(expectedExcise(consideration) - stamps) < 1;

export function classifyDeed(text: string): DeedType {
  if (/SPECIAL\s+WARRANTY/i.test(text)) return 'special_warranty_deed';
  if (/WARRANTY\s+DEED/i.test(text)) return 'warranty_deed';
  if (/QUIT\s*-?\s*CLAIM/i.test(text)) return 'quitclaim_deed';
  if (/TRUSTEE/i.test(text)) return 'trustees_deed';
  if (/\bPLAT\b/i.test(text)) return 'subdivision_plat';
  return 'other';
}

export function parseCountyDeedClipboard(rawText: string): ParsedDeedResult {
  const text = rawText.replace(/[\u00a0\u2007\u202f]/g, ' ');
  const result: ParsedDeedResult = { rawText, isFormulaVerified: false, deedType: classifyDeed(text) };

  const dm =
    text.match(new RegExp(String.raw`(?:RECORDED|REC(?:ORDING)?\s*DATE)[:\s]*` + DATE_VALUE, 'i')) ??
    text.match(new RegExp(String.raw`\bDATE[:\s]*` + DATE_VALUE, 'i'));
  if (dm) result.recordingDate = normalizeDate(dm[1]);

  const bp = text.match(/\b(?:BOOK|BK)\s*[:#]?\s*([0-9]+)\W{1,12}(?:PAGE|PG)\s*[:#]?\s*([0-9]+)/i);
  if (bp) {
    result.book = bp[1];
    result.page = bp[2];
  }

  const inst = text.match(/(?:INST(?:RUMENT)?\s*(?:#|NO\.?|NUMBER)|FILE\s*(?:#|NO\.?))\s*[:\s]?\s*([A-Z0-9-]+)/i);
  if (inst) result.instrumentNumber = inst[1];

  result.grantor = textField(text, 'GRANTOR');
  result.grantee = textField(text, 'GRANTEE');
  result.consideration = money(text, 'CONSIDERATION|SALE\\s*PRICE|AMOUNT');
  result.exciseTaxStamps = money(text, 'EXCISE\\s*(?:TAX|STAMPS)?|STAMPS');

  const pin = text.match(/(?:PARCEL\s*(?:PIN|ID|#|NO\.?)?|PIN\s*#?)\s*[:\s]\s*([0-9][0-9A-Z-]{5,})/i);
  if (pin) result.parcelPin = pin[1].trim();

  if (result.consideration !== undefined && result.exciseTaxStamps !== undefined) {
    result.isFormulaVerified = checkExcise(result.consideration, result.exciseTaxStamps);
  }
  return result;
}

export const SAMPLE_PASTE = [
  'WARRANTY DEED',
  'RECORDED: 03/14/2022    INST #: 2022009917',
  'BOOK 14611 PAGE 208',
  'GRANTOR: SAMPLE SELLER HOLDINGS LLC',
  'GRANTEE: SAMPLE BUYER PARTNERS LLC',
  'PARCEL PIN: 0419-72-8812',
  'CONSIDERATION: $1,250,000.00',
  'EXCISE TAX: $2,500.00',
].join('\n');

/** Splits a paste holding several instruments (blank-line separated) into one block per deed. */
export function splitDeedBlocks(text: string): string[] {
  const parts = text.split(/\r?\n[ \t]*\r?\n/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    const startsDeed = /^\s*(SPECIAL\s+)?(WARRANTY|QUIT\s*-?\s*CLAIM|TRUSTEE)/i.test(part);
    const newDeed = prev !== undefined && /GRANTOR/i.test(prev) && (/GRANTOR/i.test(part) || startsDeed);
    if (prev === undefined || newDeed) out.push(part);
    else out[out.length - 1] = `${prev}\n${part}`;
  }
  return out.length ? out : [text];
}
