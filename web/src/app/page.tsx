"use client";

import { useGearData } from "@/hooks/useGearData";
import { useFilters } from "@/hooks/useFilters";
import { SearchBar } from "@/components/SearchBar";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GearTable } from "@/components/GearTable";

export default function HomePage() {
  const { items, loading, error, filterOptions } = useGearData();
  const {
    filters,
    sort,
    filteredItems,
    setSearch,
    toggleSchool,
    toggleType,
    toggleRarity,
    setLevelRange,
    toggleSort,
    clearFilters,
  } = useFilters(items);

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
    <div className="flex gap-6 p-6">
      <FilterSidebar
        filterOptions={filterOptions}
        activeSchools={filters.schools}
        activeTypes={filters.types}
        activeRarities={filters.rarities}
        levelMin={filters.levelMin}
        levelMax={filters.levelMax}
        onToggleSchool={toggleSchool}
        onToggleType={toggleType}
        onToggleRarity={toggleRarity}
        onLevelChange={setLevelRange}
        onClear={clearFilters}
      />
      <div className="flex flex-1 flex-col gap-4">
        <SearchBar
          onSearch={setSearch}
          resultCount={filteredItems.length}
          totalCount={items.length}
        />
        <GearTable
          items={filteredItems}
          sort={sort}
          onSort={toggleSort}
        />
      </div>
    </div>
  );
}
