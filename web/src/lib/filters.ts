/**
 * Pure filter + sort functions for gear items.
 * No side effects, no state — easy to test & swap.
 */

import type { GearItem, GearFilters, SortConfig } from "@/data/types";

/** Search items by name (display_name + internal name) */
export function searchItems(items: GearItem[], query: string): GearItem[] {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
        (item) =>
            item.display_name?.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q),
    );
}

/** Apply all filters to the item set */
export function filterItems(
    items: GearItem[],
    filters: GearFilters,
): GearItem[] {
    return items.filter((item) => {
        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchesName =
                item.display_name?.toLowerCase().includes(q) ||
                item.name.toLowerCase().includes(q);
            if (!matchesName) return false;
        }

        // School filter
        if (
            filters.schools.length > 0 &&
            !filters.schools.includes(item.school)
        ) {
            return false;
        }

        // Type filter
        if (filters.types.length > 0 && !filters.types.includes(item.item_type)) {
            return false;
        }

        // Rarity filter
        if (
            filters.rarities.length > 0 &&
            !filters.rarities.includes(item.rarity)
        ) {
            return false;
        }

        // Level range
        if (item.level_req < filters.levelMin) return false;
        if (filters.levelMax > 0 && item.level_req > filters.levelMax) {
            return false;
        }

        return true;
    });
}

/** Sort items by a column key */
export function sortItems(
    items: GearItem[],
    config: SortConfig | null,
): GearItem[] {
    if (!config) return items;

    const { key, direction } = config;
    const mult = direction === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        // Check if it's a stat key
        if (key.startsWith("stat:")) {
            const statName = key.slice(5);
            aVal = a.stats[statName] ?? -Infinity;
            bVal = b.stats[statName] ?? -Infinity;
        } else {
            aVal = (a as Record<string, unknown>)[key] as string | number;
            bVal = (b as Record<string, unknown>)[key] as string | number;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
            return mult * aVal.localeCompare(bVal);
        }

        return mult * ((aVal as number) - (bVal as number));
    });
}

/** Pipeline: search → filter → sort */
export function processItems(
    items: GearItem[],
    filters: GearFilters,
    sort: SortConfig | null,
): GearItem[] {
    const filtered = filterItems(items, filters);
    return sortItems(filtered, sort);
}
