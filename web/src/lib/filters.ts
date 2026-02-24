/**
 * Pure filter + sort functions for gear items.
 * No side effects, no state — easy to test & swap.
 */

import type { GearItem, GearFilters, SortConfig } from "@/data/types";

import { matchSorter } from "match-sorter";

/** Search items by name (display_name + internal name) */
export function searchItems(items: GearItem[], query: string): GearItem[] {
    if (!query.trim()) return items;
    return matchSorter(items, query, {
        keys: ["display_name", "name"],
    });
}

/** Apply all filters to the item set */
export function filterItems(
    items: GearItem[],
    filters: GearFilters,
): GearItem[] {
    let result = items;

    // Fuzzy search first (if search exists)
    if (filters.search) {
        result = matchSorter(result, filters.search, {
            keys: ["display_name", "name"],
        });
    }

    return result.filter((item) => {
        // School filter
        if (
            filters.schools.length > 0 &&
            !filters.schools.includes(item.school)
        ) {
            return false;
        }
        if (filters.excludeSchools?.length > 0 && filters.excludeSchools.includes(item.school)) {
            return false;
        }

        // Type filter
        if (filters.types.length > 0 && !filters.types.includes(item.item_type)) {
            return false;
        }
        if (filters.excludeTypes?.length > 0 && filters.excludeTypes.includes(item.item_type)) {
            return false;
        }

        // Rarity filter
        if (
            filters.rarities.length > 0 &&
            !filters.rarities.includes(item.rarity)
        ) {
            return false;
        }
        if (filters.excludeRarities?.length > 0 && filters.excludeRarities.includes(item.rarity)) {
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

/** Sort items by multiple column keys */
export function sortItems(
    items: GearItem[],
    configs: SortConfig[],
): GearItem[] {
    if (!configs || configs.length === 0) return items;

    return [...items].sort((a, b) => {
        for (const { key, direction } of configs) {
            const mult = direction === "asc" ? 1 : -1;
            let aVal: string | number;
            let bVal: string | number;

            // Check if it's a stat key or rarity
            if (key === "rarity") {
                const RARITY_RANK: Record<string, number> = {
                    RT_COMMON: 1,
                    RT_UNCOMMON: 2,
                    RT_RARE: 3,
                    RT_EPIC: 4,
                };
                aVal = RARITY_RANK[a.rarity as string] || 0;
                bVal = RARITY_RANK[b.rarity as string] || 0;
            } else if (key.startsWith("stat:")) {
                const statName = key.slice(5);
                aVal = a.stats[statName] ?? -Infinity;
                bVal = b.stats[statName] ?? -Infinity;
            } else {
                aVal = (a as unknown as Record<string, unknown>)[key] as string | number;
                bVal = (b as unknown as Record<string, unknown>)[key] as string | number;
            }

            // Treat undefined/null as lowest priority when sorting ascending
            if (aVal === undefined || aVal === null) aVal = -Infinity;
            if (bVal === undefined || bVal === null) bVal = -Infinity;

            let result = 0;
            if (typeof aVal === "string" && typeof bVal === "string") {
                result = aVal.localeCompare(bVal);
            } else {
                result = (aVal as number) - (bVal as number);
            }

            if (result !== 0) return mult * result;
        }

        // If all specified stats are tied, fall back to display name alphabetically
        return a.display_name.localeCompare(b.display_name);
    });
}

/** Pipeline: search → filter → sort */
export function processItems(
    items: GearItem[],
    filters: GearFilters,
    sorts: SortConfig[],
): GearItem[] {
    const filtered = filterItems(items, filters);
    return sortItems(filtered, sorts);
}
