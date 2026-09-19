import { describe, expect, it } from 'vitest';
import { checkExcise, parseCountyDeedClipboard, SAMPLE_PASTE } from './deedParser';

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
