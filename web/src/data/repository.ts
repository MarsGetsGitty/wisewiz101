/**
 * Data access layer — abstracts the underlying data source.
 *
 * V1: reads from static JSON in public/data/gear_database.json
 * V2: swap to SQLite/API without changing consumers
 */

import type { GearItem } from "./types";

let cachedItems: GearItem[] | null = null;

/** Fetch all gear items (cached after first load) */
export async function getAllItems(): Promise<GearItem[]> {
    if (cachedItems) return cachedItems;

    const res = await fetch("/data/gear_database.json");
    if (!res.ok) {
        throw new Error(`Failed to load gear data: ${res.status}`);
    }

    cachedItems = (await res.json()) as GearItem[];
    return cachedItems;
}

/** Look up a single item by its internal name */
export async function getItemByName(
    name: string,
): Promise<GearItem | undefined> {
    const items = await getAllItems();
    return items.find((item) => item.name === name);
}

/** Extract unique filter options from the dataset */
export function getFilterOptions(items: GearItem[]) {
    const schools = new Set<string>();
    const types = new Set<string>();
    const rarities = new Set<string>();
    let maxLevel = 0;

    for (const item of items) {
        if (item.school) schools.add(item.school);
        if (item.item_type) types.add(item.item_type);
        if (item.rarity) rarities.add(item.rarity);
        if (item.level_req > maxLevel) maxLevel = item.level_req;
    }

    return {
        schools: [...schools].sort(),
        types: [...types].sort(),
        rarities: [...rarities].sort(),
        maxLevel,
    };
}
