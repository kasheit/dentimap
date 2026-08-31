import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Hospital,
  LayoutGrid,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooth } from '@/components/icons/Tooth';
import { Sidebar, type NavKey } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { KpiCard } from '@/components/KpiCard';
import { PortfolioMixPanel } from '@/components/PortfolioMixPanel';
import { PortfolioGrowthPanel } from '@/components/PortfolioGrowthPanel';
import { LocationDirectory } from '@/components/LocationDirectory';
import { LocationDetailPanel } from '@/components/LocationDetailPanel';
import { locations as seedLocations, priorYearPortfolioValue } from '@/data';
import { loadLocations, updateLocation } from '@/lib/locations';
import type { AssetType, Landlord, Location } from '@/types';
import {
  assetTypeLabel,
  assetTypeShort,
  formatCurrency,
  formatDateLong,
  formatNumber,
  getGreeting,
  percentChange,
} from '@/lib/format';

function deriveLandlords(locations: Location[]): Landlord[] {
  const map = new Map<string, Landlord>();
  for (const loc of locations) {
    if (!map.has(loc.landlordEntity)) {
      map.set(loc.landlordEntity, { entity: loc.landlordEntity, locations: [] });
    }
    map.get(loc.landlordEntity)!.locations.push(loc);
  }
  return Array.from(map.values()).sort((a, b) => b.locations.length - a.locations.length);
}

function App() {
  const [activeNav, setActiveNav] = useState<NavKey>('portfolio');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filter, setFilter] = useState<AssetType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedLandlord, setExpandedLandlord] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>(seedLocations);

  useEffect(() => {
    loadLocations().then(setLocations);
  }, []);

  const landlords = useMemo(() => deriveLandlords(locations), [locations]);

  const totalValue = useMemo(
    () => locations.reduce((sum, location) => sum + location.currentAssetValuation, 0),
    [locations],
  );
  const assetCounts = useMemo(
    () =>
      locations.reduce(
        (acc, location) => {
          acc[location.assetType] += 1;
          return acc;
        },
        { dental: 0, asc: 0, dual: 0 } as Record<AssetType, number>,
      ),
    [locations],
  );
  const cityCount = useMemo(
    () => new Set(locations.map((location) => location.city)).size,
    [locations],
  );
  const visibleLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter((location) =>
      [location.name, location.city, location.state, location.landlordEntity, location.recordId]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [locations, search]);
  const valueChange = percentChange(totalValue, priorYearPortfolioValue * 1000000);

  const navigate = (key: NavKey) => {
    setActiveNav(key);
    if (key !== 'locations') setSelectedLocation(null);
  };

  const pageTitle = activeNav === 'portfolio' ? 'Portfolio overview' : navTitle(activeNav);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <Sidebar
        active={activeNav}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        locationCount={locations.length}
      />

      <main className={`min-h-screen transition-[margin] duration-300 ${collapsed ? 'ml-[76px]' : 'ml-[264px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md dark:border-navy-800 dark:bg-navy-950/90">
          <div className="flex h-[72px] items-center justify-between px-6 lg:px-10">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-navy-400 dark:text-navy-300">Portfolio</span>
              <ChevronRight className="h-3.5 w-3.5 text-navy-300 dark:text-navy-500" />
              <span className="font-medium text-navy-700 dark:text-navy-100">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-navy-400 dark:text-navy-300 md:inline">
                {formatDateLong()}
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-navy-700" />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10 lg:py-10">
          {activeNav === 'portfolio' && (
            <PortfolioOverview
              locations={locations}
              totalValue={totalValue}
              valueChange={valueChange}
              assetCounts={assetCounts}
              cityCount={cityCount}
              onViewLocations={() => navigate('locations')}
              onSelectLocation={setSelectedLocation}
            />
          )}
          {activeNav === 'locations' && (
            <LocationsView
              locations={visibleLocations}
              totalLocations={locations.length}
              filter={filter}
              onFilterChange={setFilter}
              onSelect={setSelectedLocation}
              selectedId={selectedLocation?.id}
              search={search}
              onSearch={setSearch}
            />
          )}
          {activeNav === 'landlords' && (
            <LandlordsView
              landlords={landlords}
              onSelect={setSelectedLocation}
              expanded={expandedLandlord ?? landlords[0]?.entity ?? null}
              onExpand={setExpandedLandlord}
            />
          )}
          {activeNav === 'documents' && <DocumentsView />}
          {activeNav === 'activity' && <ActivityView />}
        </div>
      </main>

      <LocationDetailPanel
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onViewArchive={() => {
          setSelectedLocation(null);
          setActiveNav('documents');
        }}
        onSave={async (updated) => {
          const persisted = await updateLocation(updated);
          const next = persisted ?? updated;
          setLocations((prev) => prev.map((loc) => (loc.id === next.id ? next : loc)));
          setSelectedLocation(next);
          return persisted !== null;
        }}
      />
    </div>
  );
}

function navTitle(active: NavKey): string {
  switch (active) {
    case 'locations':
      return 'Locations';
    case 'landlords':
      return 'Landlords';
    case 'documents':
      return 'Documents';
    case 'activity':
      return 'Activity log';
    default:
      return 'Portfolio overview';
  }
}

interface PortfolioOverviewProps {
  locations: Location[];
  totalValue: number;
  valueChange: number;
  assetCounts: Record<AssetType, number>;
  cityCount: number;
  onViewLocations: () => void;
  onSelectLocation: (location: Location) => void;
}

function PortfolioOverview({ locations, totalValue, valueChange, assetCounts, cityCount, onViewLocations, onSelectLocation }: PortfolioOverviewProps) {
  return (
    <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label-eyebrow">Owner dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-800 dark:text-white lg:text-[34px]">
            {getGreeting()}, Eshan.
          </h1>
          <p className="mt-2 text-sm text-navy-500 dark:text-navy-300">
            Here's the current pulse of your clinical real estate portfolio.
          </p>
        </div>
        <button
          onClick={onViewLocations}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-navy-700 shadow-sm transition-colors hover:border-navy-300 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
        >
          View all locations
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <KpiCard
          label="Total portfolio value"
          value={formatCurrency(totalValue, true)}
          sublabel="Current asset valuation"
          change={{ value: `+${valueChange.toFixed(1)}%`, positive: true, caption: 'vs. prior year' }}
          icon={ShieldCheck}
          index={0}
        />
        <KpiCard
          label="Active locations"
          value={String(locations.length)}
          sublabel={`Across ${cityCount} cities`}
          icon={MapPin}
          index={1}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <PortfolioMixPanel counts={assetCounts} />
        <PortfolioGrowthPanel />
      </div>

      <div className="mt-4">
        <LocationDirectory
          locations={locations}
          filter="all"
          onFilterChange={() => undefined}
          onSelect={onSelectLocation}
        />
      </div>
    </>
  );
}

interface LocationsViewProps {
  locations: Location[];
  totalLocations: number;
  filter: AssetType | 'all';
  onFilterChange: (filter: AssetType | 'all') => void;
  onSelect: (location: Location) => void;
  selectedId?: string;
  search: string;
  onSearch: (value: string) => void;
}

function LocationsView({
  locations: filteredLocations,
  totalLocations,
  filter,
  onFilterChange,
  onSelect,
  selectedId,
  search,
  onSearch,
}: LocationsViewProps) {
  return (
    <>
      <PageHeading
        eyebrow="Portfolio directory"
        title="Locations"
        description="A complete view of every clinical real estate asset in the portfolio."
      />
      <div className="mt-8 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search locations, cities, landlords..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-navy-800 outline-none transition-colors placeholder:text-navy-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-300"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="hidden text-xs text-navy-400 dark:text-navy-300 sm:inline">
          {filteredLocations.length} of {totalLocations} records
        </span>
      </div>
      <div className="mt-4">
        <LocationDirectory
          locations={filteredLocations}
          filter={filter}
          onFilterChange={onFilterChange}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      </div>
    </>
  );
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="label-eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-800 dark:text-white lg:text-[34px]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-navy-500 dark:text-navy-300">{description}</p>
    </div>
  );
}

interface LandlordsViewProps {
  landlords: Landlord[];
  onSelect: (location: Location) => void;
  expanded: string | null;
  onExpand: (entity: string | null) => void;
}

function LandlordsView({ landlords, onSelect, expanded, onExpand }: LandlordsViewProps) {
  return (
    <>
      <PageHeading
        eyebrow="Ownership relationships"
        title="Landlords"
        description="See the entities behind your portfolio and the locations connected to each one."
      />
      <div className="mt-8 grid gap-3 xl:grid-cols-2">
        {landlords.map((landlord, index) => {
          const isExpanded = expanded === landlord.entity;
          const value = landlord.locations.reduce((sum, location) => sum + location.currentAssetValuation, 0);
          return (
            <motion.div
              key={landlord.entity}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-navy-700 dark:bg-navy-800"
            >
              <button
                onClick={() => onExpand(isExpanded ? null : landlord.entity)}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-navy-700/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-navy-800 dark:text-white">{landlord.entity}</h2>
                  <p className="mt-1 text-xs text-navy-400 dark:text-navy-300">
                    {landlord.locations.length} connected {landlord.locations.length === 1 ? 'location' : 'locations'} · {formatCurrency(value, true)} total value
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-600 dark:bg-navy-700 dark:text-navy-200">
                  {landlord.locations.length} assets
                </span>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-navy-400" /> : <ChevronRight className="h-4 w-4 text-navy-400" />}
              </button>
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-navy-700 dark:bg-navy-900/30">
                  {landlord.locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => onSelect(location)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-white dark:hover:bg-navy-700/60"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm dark:bg-navy-700 dark:text-teal-300">
                        {location.assetType === 'asc' ? <Hospital className="h-4 w-4" /> : <Tooth className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-navy-700 dark:text-navy-100">{location.name}</span>
                        <span className="mt-0.5 block text-xs text-navy-400 dark:text-navy-300">{location.city}, {location.state} · {assetTypeShort(location.assetType)}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-navy-300" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

function DocumentsView() {
  return (
    <>
      <PageHeading eyebrow="Records & compliance" title="Documents" description="A central archive for deeds, leases, valuations, and clinical operating records." />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: FileText, label: 'Title deeds', count: '12 records', color: 'teal' },
          { icon: ShieldCheck, label: 'Valuation reports', count: '12 verified', color: 'navy' },
          { icon: Stethoscope, label: 'Clinical licenses', count: '9 current', color: 'teal' },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-navy-700 dark:bg-navy-800">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color === 'teal' ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300' : 'bg-navy-100 text-navy-600 dark:bg-navy-700 dark:text-navy-200'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-navy-800 dark:text-white">{label}</h2>
            <p className="mt-1 text-xs text-navy-400 dark:text-navy-300">{count}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-navy-700 dark:bg-navy-800">
        <FileText className="mx-auto h-6 w-6 text-navy-300 dark:text-navy-500" />
        <p className="text-sm text-navy-500 dark:text-navy-300">Select a location from the directory to open its document archive.</p>
      </div>
    </>
  );
}

function ActivityView() {
  const events = [
    ['Today', 'Location record added', 'S. Charlotte', '2 hours ago'],
    ['Today', 'Location record added', 'Garner', '5 hours ago'],
    ['Yesterday', 'Landlord tie confirmed', 'Fayetteville (Valleygate)', 'Yesterday'],
    ['Aug 28', 'Location record added', 'Laurinburg', '3 days ago'],
  ];
  return (
    <>
      <PageHeading eyebrow="Audit trail" title="Activity log" description="A chronological record of important portfolio changes and decisions." />
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-navy-700 dark:bg-navy-800">
        {events.map(([date, title, location, time], i) => (
          <div key={title} className="flex gap-4 border-b border-slate-100 p-5 last:border-0 dark:border-navy-700">
            <div className="flex w-20 shrink-0 items-start gap-2 text-xs font-medium text-navy-400 dark:text-navy-300"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500" />{date}</div>
            <div className="flex-1"><p className="text-sm font-semibold text-navy-800 dark:text-white">{title}</p><p className="mt-1 text-[13px] text-navy-500 dark:text-navy-300">{location}</p></div>
            <span className="text-xs text-navy-400 dark:text-navy-300">{time}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
