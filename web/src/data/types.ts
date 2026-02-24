/** TypeScript types for gear items — mirrors Python GearItem.to_dict() */

export interface GearItem {
    source_path: string;
    name: string;
    display_name: string;
    display_name_key: string;
    item_type: string;
    school: string;
    rarity: string;
    flags: string[];
    sockets: string[];
    stats: Record<string, number>;
    behaviors: string[];
    adjref: string;
    set_name: string;
    level_req: number;
    type_source: string;
    raw_stats: Record<string, number>;
}

/** Filter state for the gear browser */
export interface GearFilters {
    search: string;
    schools: string[];
    types: string[];
    rarities: string[];
    levelMin: number;
    levelMax: number;
}

/** Sort configuration */
export interface SortConfig {
    key: string;
    direction: "asc" | "desc";
}
