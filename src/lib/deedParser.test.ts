import { describe, expect, it } from 'vitest';
import { checkExcise, parseCountyDeedClipboard, splitDeedBlocks } from './deedParser';

const SAMPLE_PASTE = [
  'WARRANTY DEED',
  'RECORDED: 03/14/2022    INST #: 2022009917',
  'BOOK 14611 PAGE 208',
  'GRANTOR: SAMPLE SELLER HOLDINGS LLC',
  'GRANTEE: SAMPLE BUYER PARTNERS LLC',
  'PARCEL PIN: 0419-72-8812',
  'CONSIDERATION: $1,250,000.00',
  'EXCISE TAX: $2,500.00',
].join(String.fromCharCode(10));

describe('parseCountyDeedClipboard', () => {
  it('parses the sample county paste', () => {
    const r = parseCountyDeedClipboard(SAMPLE_PASTE);
    expect(r.recordingDate).toBe('2022-03-14');
    expect(r.instrumentNumber).toBe('2022009917');
    expect(r.book).toBe('14611');
    expect(r.page).toBe('208');
    expect(r.grantor).toBe('SAMPLE SELLER HOLDINGS LLC');
    expect(r.grantee).toBe('SAMPLE BUYER PARTNERS LLC');
    expect(r.consideration).toBe(1250000);
    expect(r.exciseTaxStamps).toBe(2500);
    expect(r.parcelPin).toBe('0419-72-8812');
    expect(r.deedType).toBe('warranty_deed');
    expect(r.isFormulaVerified).toBe(true);
  });

  it('parses single-line pipe-delimited text and a special warranty deed', () => {
    const r = parseCountyDeedClipboard(
      'SPECIAL WARRANTY DEED | REC DATE: 2018-06-03 | BK 12891 PG 114 | GRANTOR: Corridor Parkway Holdings Inc | GRANTEE: Cabarrus Medical Land Trust | SALE PRICE: $980,000 | EXCISE STAMPS: $1,960',
    );
    expect(r.deedType).toBe('special_warranty_deed');
    expect(r.recordingDate).toBe('2018-06-03');
    expect(r.book).toBe('12891');
    expect(r.grantor).toBe('Corridor Parkway Holdings Inc');
    expect(r.grantee).toBe('Cabarrus Medical Land Trust');
    expect(r.isFormulaVerified).toBe(true);
  });

  it('flags an excise mismatch', () => {
    const r = parseCountyDeedClipboard('RECORDED: 1/2/21\nGRANTOR: A\nGRANTEE: B\nCONSIDERATION: $1,450,000\nEXCISE: $2,000');
    expect(r.recordingDate).toBe('2021-01-02');
    expect(r.isFormulaVerified).toBe(false);
  });
});

describe('checkExcise', () => {
  it('rounds consideration up to the next $500', () => {
    expect(checkExcise(1450000, 2900)).toBe(true);
    expect(checkExcise(1450100, 2901)).toBe(true);
    expect(checkExcise(0, 0)).toBe(true);
    expect(checkExcise(1450000, 2800)).toBe(false);
  });
});

describe('splitDeedBlocks', () => {
  const NL = String.fromCharCode(10);
  const join = (...lines: string[]) => lines.join(NL);
  it('keeps a single deed with internal blank lines together', () => {
    expect(splitDeedBlocks(join('WARRANTY DEED', 'GRANTOR: A', '', 'GRANTEE: B', '', 'CONSIDERATION: $500'))).toHaveLength(1);
  });
  it('splits two deeds on blank lines', () => {
    const blocks = splitDeedBlocks(join('WARRANTY DEED', 'GRANTOR: A', 'GRANTEE: B', '', 'QUITCLAIM DEED', 'GRANTOR: B', 'GRANTEE: C'));
    expect(blocks).toHaveLength(2);
    expect(parseCountyDeedClipboard(blocks[1]).deedType).toBe('quitclaim_deed');
  });
});

describe('assessor values', () => {
  it('reads land, building and total assessed value', () => {
    const NL = String.fromCharCode(10);
    const r = parseCountyDeedClipboard(['PARCEL ID: 0419-72-8812', 'LAND VALUE: $400,000', 'BUILDING VALUE: $1,050,000', 'TOTAL ASSESSED VALUE: $1,450,000'].join(NL));
    expect(r.landValue).toBe(400000);
    expect(r.buildingValue).toBe(1050000);
    expect(r.assessedValue).toBe(1450000);
  });
});

describe('assessor sale vs deed date', () => {
  it('keeps the last sale date separate from the deed date', () => {
    const NL = String.fromCharCode(10);
    const r = parseCountyDeedClipboard(['Date Sold 9/29/2000', 'Sale Price $490,000', 'Book 019281', 'Page 01592', 'Deed Date 3/10/2023'].join(NL));
    expect(r.saleDate).toBe('2000-09-29');
    expect(r.recordingDate).toBe('2023-03-10');
    expect(r.consideration).toBe(490000);
  });
});
