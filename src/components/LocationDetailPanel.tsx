import { useEffect, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  FileText,
  Hospital,
  Landmark,
  Layers,
  MapPin,
  Pencil,
  Ruler,
  UserCog,
  X,
} from 'lucide-react';
import { Tooth } from '@/components/icons/Tooth';
import type { Location, LocationStatus } from '@/types';
import { assetTypeLabel, formatCurrency, formatDate, formatNumber } from '@/lib/format';

interface LocationDetailPanelProps {
  location: Location | null;
  onClose: () => void;
  onViewArchive: () => void;
  onSave: (updated: Location) => Promise<boolean>;
}

const STATUS_OPTIONS: LocationStatus[] = [
  'Operating',
  'Under renovation',
  'Lease review',
  'Acquisition pending',
];

function Delta({ original, current }: { original: number; current: number }) {
  const pct = ((current - original) / original) * 100;
  const positive = current >= original;
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
          positive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        <ArrowUpRight className={`h-3.5 w-3.5 ${positive ? '' : 'rotate-90'}`} />
        {Math.abs(pct).toFixed(1)}%
      </span>
      <span className="text-xs text-navy-400 dark:text-navy-300">since acquisition</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-eyebrow">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-navy-800 dark:text-white">{children}</div>
    </div>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-800 dark:text-white';

function EditField({
  label,
  value,
  onChange,
  mono,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  mono?: boolean;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <p className="label-eyebrow">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

export function LocationDetailPanel({
  location,
  onClose,
  onViewArchive,
  onSave,
}: LocationDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Location | null>(location);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(location);
    setEditing(false);
    setSaving(false);
  }, [location?.id]);

  const active = location === null ? null : editing ? draft : location;

  const set = <K extends keyof Location>(key: K, value: Location[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="scrollbar-thin fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-white shadow-panel dark:bg-navy-900"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 pt-5 pb-4 backdrop-blur dark:border-navy-700 dark:bg-navy-900/90">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-600 dark:text-teal-400">
                    Location record · {active.recordId}
                  </p>
                  {editing ? (
                    <input
                      value={draft?.name ?? ''}
                      onChange={(e) => set('name', e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-display text-xl font-bold tracking-tight text-navy-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
                    />
                  ) : (
                    <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-navy-800 dark:text-white">
                      {active.name}
                    </h2>
                  )}
                  {editing ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        value={draft?.city ?? ''}
                        onChange={(e) => set('city', e.target.value)}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[13px] text-navy-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
                      />
                      <input
                        value={draft?.state ?? ''}
                        onChange={(e) => set('state', e.target.value)}
                        className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[13px] text-navy-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-navy-400 dark:text-navy-300">
                      <MapPin className="h-3.5 w-3.5" />
                      {active.city}, {active.state}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {editing ? (
                    <>
                      <button
                        onClick={() => {
                          setDraft(location);
                          setEditing(false);
                        }}
                        disabled={saving}
                        className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-navy-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-navy-300 dark:hover:bg-navy-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-navy-500 transition-colors hover:bg-slate-100 dark:text-navy-300 dark:hover:bg-navy-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-400 transition-colors hover:bg-slate-100 hover:text-navy-700 dark:text-navy-300 dark:hover:bg-navy-700 dark:hover:text-white"
                    aria-label="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {editing ? (
                  <select
                    value={draft?.status}
                    onChange={(e) => set('status', e.target.value as LocationStatus)}
                    className="rounded-full border border-slate-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 outline-none dark:border-navy-600 dark:bg-teal-500/15 dark:text-teal-300"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    {active.status}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-600 dark:bg-navy-700 dark:text-navy-200">
                  Portfolio record
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-navy-600 dark:bg-navy-700 dark:text-navy-200">
                  {active.recordId}
                </span>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* Asset summary */}
              <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-navy-700 dark:bg-navy-800/50">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    active.assetType === 'asc'
                      ? 'bg-navy-100 text-navy-600 dark:bg-navy-700 dark:text-navy-200'
                      : 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300'
                  }`}
                >
                  {active.assetType === 'asc' ? (
                    <Hospital className="h-6 w-6" />
                  ) : (
                    <Tooth className="h-6 w-6" />
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={draft?.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] leading-relaxed text-navy-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-200"
                  />
                ) : (
                  <p className="text-[13px] leading-relaxed text-navy-600 dark:text-navy-200">
                    {active.description}
                  </p>
                )}
              </div>

              {/* Asset profile */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-navy-500 dark:text-navy-200">
                    Asset profile
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4 dark:border-navy-700">
                  <Field label="Asset classification">{assetTypeLabel(active.assetType)}</Field>
                  {editing ? (
                    <EditField
                      label="Date opened"
                      value={draft?.dateEstablished ?? ''}
                      onChange={(v) => set('dateEstablished', v)}
                    />
                  ) : (
                    <Field label="Date opened">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-navy-400" />
                        {formatDate(active.dateEstablished)}
                      </span>
                    </Field>
                  )}
                  {editing ? (
                    <EditField
                      label="Operating footprint (sq ft)"
                      type="number"
                      value={draft?.operatingFootprintSqFt ?? 0}
                      onChange={(v) => set('operatingFootprintSqFt', Number(v) || 0)}
                    />
                  ) : (
                    <Field label="Operating footprint">
                      <span className="inline-flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5 text-navy-400" />
                        {formatNumber(active.operatingFootprintSqFt)} sq ft
                      </span>
                    </Field>
                  )}
                  <Field label="Clinical specialty">
                    <div className="flex flex-wrap gap-1.5">
                      {active.specialty.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </Field>
                  <div className="col-span-2">
                    <p className="label-eyebrow">Specialty tags</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {['Clinical asset', 'Patient-facing', ...active.specialty].map(
                        (tag, idx) => (
                          <span
                            key={tag + idx}
                            className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-navy-500 dark:border-navy-600 dark:text-navy-300"
                          >
                            {tag}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Ownership & title */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-navy-500 dark:text-navy-200">
                    Ownership &amp; title
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4 dark:border-navy-700">
                  {editing ? (
                    <EditField
                      label="Landlord entity"
                      value={draft?.landlordEntity ?? ''}
                      onChange={(v) => set('landlordEntity', v)}
                    />
                  ) : (
                    <Field label="Landlord entity">{active.landlordEntity}</Field>
                  )}
                  {editing ? (
                    <EditField
                      label="Title deed reference"
                      value={draft?.deedBookPage ?? ''}
                      onChange={(v) => set('deedBookPage', v)}
                      mono
                    />
                  ) : (
                    <Field label="Title deed reference">
                      <span className="font-mono text-[13px]">{active.deedBookPage}</span>
                    </Field>
                  )}
                  <div className="col-span-2">
                    <p className="label-eyebrow">Lease structure notes</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600 dark:text-navy-200">
                      Triple-net lease held by {active.landlordEntity}. Deed reference{' '}
                      <span className="font-mono">{active.deedBookPage}</span> filed with county
                      registrar.
                    </p>
                  </div>
                </div>
              </section>

              {/* Site history */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-navy-500 dark:text-navy-200">
                    Site history
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4 dark:border-navy-700">
                  {editing ? (
                    <EditField
                      label="Previous occupant"
                      value={draft?.previousOccupant ?? ''}
                      onChange={(v) => set('previousOccupant', v)}
                    />
                  ) : (
                    <Field label="Previous occupant">{active.previousOccupant}</Field>
                  )}
                  {editing ? (
                    <EditField
                      label="Original land owner"
                      value={draft?.originalLandOwner ?? ''}
                      onChange={(v) => set('originalLandOwner', v)}
                    />
                  ) : (
                    <Field label="Original land owner">{active.originalLandOwner}</Field>
                  )}
                </div>
              </section>

              {/* Asset valuation */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-navy-500 dark:text-navy-200">
                    Asset valuation
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-100 p-4 dark:border-navy-700">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified valuation
                  </div>
                  {editing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <EditField
                        label="Original land value"
                        type="number"
                        value={draft?.originalLandValue ?? 0}
                        onChange={(v) => set('originalLandValue', Number(v) || 0)}
                      />
                      <EditField
                        label="Current asset valuation"
                        type="number"
                        value={draft?.currentAssetValuation ?? 0}
                        onChange={(v) => set('currentAssetValuation', Number(v) || 0)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-navy-800/60">
                          <p className="label-eyebrow">Original land value</p>
                          <p className="mt-1 font-display text-lg font-bold text-navy-700 dark:text-navy-100">
                            {formatCurrency(active.originalLandValue)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-500/10">
                          <p className="label-eyebrow text-teal-700 dark:text-teal-300">
                            Current asset valuation
                          </p>
                          <p className="mt-1 font-display text-lg font-bold text-teal-700 dark:text-teal-300">
                            {formatCurrency(active.currentAssetValuation)}
                          </p>
                        </div>
                      </div>
                      <Delta
                        original={active.originalLandValue}
                        current={active.currentAssetValuation}
                      />
                    </>
                  )}
                </div>
              </section>

              {/* CTA */}
              {!editing && (
                <button
                  onClick={onViewArchive}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 dark:bg-navy-700 dark:hover:bg-navy-600"
                >
                  <FileText className="h-4 w-4" />
                  View document archive
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
