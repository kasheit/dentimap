import { LevelLabel } from './Chips';
import { fmtDate, personRoleLabel } from '@/lib/format';
import { useDentimap } from '@/lib/store';
import type { Property } from '@/lib/types';

export function KeyPeople({ property }: { property: Property }) {
  const { people, openPerson, updatePerson } = useDentimap();
  const linked = people.filter((p) => p.propertyIds.includes(property.id) || p.actions.some((a) => a.propertyId === property.id));
  const available = people.filter((p) => !linked.some((l) => l.id === p.id));

  return (
    <div>
      {linked.length === 0 ? (
        <p className="text-[13px] text-dm-dim">No people linked.</p>
      ) : (
        <ul className="divide-y divide-dm-border/70">
          {linked.map((p) => {
            const acts = p.actions.filter((a) => a.propertyId === property.id).sort((a, b) => b.date.localeCompare(a.date));
            return (
              <li key={p.id} className="py-3 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <button onClick={() => openPerson(p.id)} className="text-left text-[15px] font-medium hover:text-dm-blue">
                    {p.name}
                  </button>
                  <span className="text-[13px] text-dm-dim">
                    {p.roles.map((r) => personRoleLabel[r]).join(' · ')}
                    {p.status === 'former' && ' · Former'}
                  </span>
                </div>
                {p.relevance && <p className="mt-1 text-[13px] leading-relaxed text-dm-muted">{p.relevance}</p>}
                {acts.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {acts.map((a) => (
                      <li key={a.id} className="grid gap-x-3 sm:grid-cols-[6.5rem_1fr]">
                        <span className="tnum text-[13px] text-dm-dim">{fmtDate(a.date)}</span>
                        <div className="text-[13px]">
                          {a.text}
                          <div className="mt-0.5">
                            <LevelLabel level={a.state === 'verified' ? 'confirmed' : 'partial'} detail={a.source} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {available.length > 0 && (
        <select
          className="field mt-3"
          value=""
          onChange={(e) => {
            const person = people.find((x) => x.id === e.target.value);
            if (person) updatePerson(person.id, { propertyIds: [...person.propertyIds, property.id] });
          }}
          aria-label="Link a person to this location"
        >
          <option value="">+ Link a person…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
