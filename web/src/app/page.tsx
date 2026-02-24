"use client";

import { useGearData } from "@/hooks/useGearData";
import { useFilters } from "@/hooks/useFilters";
import { SearchBar } from "@/components/SearchBar";
import { useMemo } from "react";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GearTable } from "@/components/GearTable";
import { ColumnPicker } from "@/components/ColumnPicker";
import { sortStats } from "@/lib/constants";

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
    <div className="flex flex-col gap-6 p-4 md:flex-row md:p-6">
      <FilterSidebar
        filterOptions={filterOptions}
        activeSchools={filters.schools}
        excludeSchools={filters.excludeSchools}
        activeTypes={filters.types}
        excludeTypes={filters.excludeTypes}
        activeRarities={filters.rarities}
        excludeRarities={filters.excludeRarities}
        levelMin={filters.levelMin}
        levelMax={filters.levelMax}
        onToggleSchool={toggleSchool}
        onToggleType={toggleType}
        onToggleRarity={toggleRarity}
        onLevelChange={setLevelRange}
        showStatHats={filters.showStatHats}
        onToggleStatHats={toggleShowStatHats}
        showDeveloperGear={filters.showDeveloperGear}
        onToggleShowDeveloperGear={toggleShowDeveloperGear}
        onClear={clearFilters}
      />
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-full sm:flex-1">
            <SearchBar
              onSearch={setSearch}
              resultCount={filteredItems.length}
              totalCount={items.length}
            />
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
        <GearTable
          items={filteredItems}
          sorts={sorts}
          activeStats={filters.columns}
          defaultStats={defaultStats}
          onSort={toggleSort}
        />
      </div>
    </div>
  );
}
