"use client";

import { useGearData } from "@/hooks/useGearData";
import { useFilters } from "@/hooks/useFilters";
import { SearchBar } from "@/components/SearchBar";
import { useMemo } from "react";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GearTable } from "@/components/GearTable";
import { ColumnPicker } from "@/components/ColumnPicker";
import { sortStats } from "@/lib/constants";
import { TypeTabs } from "@/components/TypeTabs";

export default function HomePage() {
  const { items, loading, error, filterOptions } = useGearData();
  const {
    filters,
    sorts,
    filteredItems,
    setSearch,
    toggleSchool,
    toggleType,
    toggleRarity,
    setLevelRange,
    toggleSort,
    toggleColumn,
    setColumns,
    clearColumns,
    clearFilters,
    toggleShowStatHats,
    toggleShowDeveloperGear,
    toggleSource,
  } = useFilters(items);

  const availableStats = useMemo(() => {
    const stats = new Set<string>();
    items.forEach((i) => Object.keys(i.stats).forEach((s) => stats.add(s)));
    return sortStats(Array.from(stats));
  }, [items]);

  // Stable default columns from the full dataset (not affected by sort/filter)
  const defaultStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      for (const key of Object.keys(item.stats)) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key]) => key);
  }, [items]);

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-6 py-4 text-red-400">
          <p className="font-semibold">Failed to load gear data</p>
          <p className="mt-1 text-sm text-red-400/60">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-foreground/40">
            Loading 50,000+ gear items...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:flex-row md:p-6 md:h-[calc(100vh-73px)] md:overflow-hidden">
      <FilterSidebar
        filterOptions={filterOptions}
        activeSchools={filters.schools}
        excludeSchools={filters.excludeSchools}
        activeRarities={filters.rarities}
        excludeRarities={filters.excludeRarities}
        levelMin={filters.levelMin}
        levelMax={filters.levelMax}
        onToggleSchool={toggleSchool}
        onToggleRarity={toggleRarity}
        onLevelChange={setLevelRange}
        showStatHats={filters.showStatHats}
        onToggleStatHats={toggleShowStatHats}
        showDeveloperGear={filters.showDeveloperGear}
        onToggleShowDeveloperGear={toggleShowDeveloperGear}
        onClear={clearFilters}
        activeSources={filters.sources}
        onToggleSource={toggleSource}
      />
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Header Row: Tabs + Search + Columns */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between border-b border-border gap-4 shrink-0">
          <div className="w-full xl:flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <TypeTabs
              availableTypes={filterOptions.types}
              activeType={filters.types[0] || null} // nuqs still parses array, we treat it as single-select
              onSelectType={toggleType}
            />
          </div>
          <div className="flex items-center gap-3 w-full xl:w-auto pb-3 xl:pb-2 shrink-0">
            <div className="flex-1 xl:w-64">
              <SearchBar onSearch={setSearch} />
            </div>
            <ColumnPicker
              availableStats={availableStats}
              activeColumns={filters.columns}
              defaultStats={defaultStats}
              onToggleColumn={toggleColumn}
              onSetColumns={setColumns}
              onClearColumns={clearColumns}
            />
          </div>
        </div>
        <GearTable
          items={filteredItems}
          sorts={sorts}
          activeStats={filters.columns}
          defaultStats={defaultStats}
          onSort={toggleSort}
          activeType={filters.types[0] || null} // pass activeType down so table can hide subtitles
        />
      </div>
    </div>
  );
}
