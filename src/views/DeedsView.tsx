import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Search } from 'lucide-react';
import { VerifyChip } from '@/components/Chips';
import { expectedExcise } from '@/lib/deedParser';
import { deedTypeLabel, fmtDate, usd } from '@/lib/format';
import { useDentimap } from '@/lib/store';

export function DeedsView() {
  const { deeds, properties, openProperty } = useDentimap();
  const [q, setQ] = useState('');
  const [desc, setDesc] = useState(true);
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return deeds
      .map((d) => ({ d, prop: properties.find((p) => p.id === d.propertyId) }))
      .filter(({ d, prop }) => {
        if (onlyFlagged && d.isFormulaVerified) return false;
        if (!needle) return true;
        return [d.grantor, d.grantee, d.instrumentNumber, d.book, d.page, d.source, prop?.name, deedTypeLabel[d.deedType]].join(' ').toLowerCase().includes(needle);
      })
      .sort((a, b) => (desc ? -1 : 1) * a.d.recordingDate.localeCompare(b.d.recordingDate));
  }, [deeds, properties, q, desc, onlyFlagged]);

  const total = deeds.reduce((s, d) => s + d.consideration, 0);
  const flagged = deeds.filter((d) => !d.isFormulaVerified).length;
  const stat = (label: string, value: string, tone = '') => (
    <div className="bg-dm-surface px-5 py-4">
      <div className="label">{label}</div>
      <div className={`mt-1.5 tnum text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deeds &amp; title registry</h1>
        <p className="mt-1 text-sm text-dm-muted">Every recorded instrument across the network. Open a facility to paste and add new records.</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-dm-border bg-dm-border lg:grid-cols-4">
        {stat('Instruments', String(deeds.length))}
        {stat('Facilities with deeds', String(new Set(deeds.map((d) => d.propertyId)).size))}
        {stat('Total consideration', usd(total))}
        {stat('Excise mismatches', String(flagged), flagged ? 'text-dm-red' : 'text-dm-green')}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dm-dim" />
          <input className="field pl-9" placeholder="Filter by party, instrument, facility…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className={`btn ${onlyFlagged ? 'btn-primary' : ''}`} onClick={() => setOnlyFlagged((f) => !f)}>
          <AlertTriangle className="h-3.5 w-3.5" /> Mismatches only
        </button>
        <span className="ml-auto tnum text-[11px] text-dm-dim">{rows.length} shown</span>
      </div>

      <div className="scroll-thin overflow-x-auto rounded-xl border border-dm-border bg-dm-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-dm-border">
              <th className="px-4 py-3">
                <button className="label flex items-center gap-1 hover:text-dm-muted" onClick={() => setDesc((d) => !d)}>
                  Recorded {desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                </button>
              </th>
              {['Facility', 'Instrument', 'Grantor → Grantee', 'Consideration', 'Excise check', 'Status'].map((h) => (
                <th key={h} className="label px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, prop }) => (
              <tr key={d.id} className="border-b border-dm-border/60 align-top transition-colors last:border-0 hover:bg-dm-hover">
                <td className="whitespace-nowrap px-4 py-3 tnum text-xs">{fmtDate(d.recordingDate)}</td>
                <td className="px-4 py-3">
                  {prop ? (
                    <button className="text-left font-medium transition-colors hover:text-dm-blue" onClick={() => openProperty(prop.id)}>{prop.name}</button>
                  ) : (
                    <span className="text-dm-dim">Unlinked</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs">{deedTypeLabel[d.deedType]}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-dm-dim">
                    {[d.instrumentNumber, d.book && d.page ? `Bk ${d.book}/Pg ${d.page}` : undefined].filter(Boolean).join(' · ') || '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-dm-muted">{d.grantor}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-dm-dim" />
                    <span>{d.grantee}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tnum text-xs">{usd(d.consideration)}</td>
                <td className="whitespace-nowrap px-4 py-3 tnum text-xs">
                  {d.isFormulaVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-dm-green"><CheckCircle2 className="h-3.5 w-3.5" /> {usd(d.exciseTaxStamps, 2)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-dm-red" title={`Expected ${usd(expectedExcise(d.consideration), 2)}`}>
                      <AlertTriangle className="h-3.5 w-3.5" /> {usd(d.exciseTaxStamps, 2)} ≠ {usd(expectedExcise(d.consideration), 2)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3"><VerifyChip state={d.confidence} /></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-dm-dim">No instruments match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
