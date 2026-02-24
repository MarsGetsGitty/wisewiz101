/** Display constants — school colors, rarity labels, stat groupings */

export const SCHOOL_COLORS: Record<string, string> = {
    Balance: "var(--color-school-balance)",
    Death: "var(--color-school-death)",
    Fire: "var(--color-school-fire)",
    Ice: "var(--color-school-ice)",
    Life: "var(--color-school-life)",
    Myth: "var(--color-school-myth)",
    Shadow: "var(--color-school-shadow)",
    Storm: "var(--color-school-storm)",
    All: "var(--color-primary-500)",
};

export const SCHOOL_EMOJI: Record<string, string> = {
    Balance: "⚖️",
    Death: "💀",
    Fire: "🔥",
    Ice: "❄️",
    Life: "🌿",
    Myth: "⚡",
    Shadow: "🌑",
    Storm: "⛈️",
    All: "✨",
};

export const RARITY_LABELS: Record<string, string> = {
    RT_COMMON: "Common",
    RT_UNCOMMON: "Uncommon",
    RT_RARE: "Rare",
    RT_EPIC: "Epic",
};

export const RARITY_COLORS: Record<string, string> = {
    RT_COMMON: "var(--color-rarity-common)",
    RT_UNCOMMON: "var(--color-rarity-uncommon)",
    RT_RARE: "var(--color-rarity-rare)",
    RT_EPIC: "var(--color-rarity-epic)",
};

/** Human-friendly socket type labels */
export const SOCKET_LABELS: Record<string, string> = {
    SOCKETTYPE_TEAR: "Tear",
    SOCKETTYPE_CIRCLE: "Circle",
    SOCKETTYPE_SQUARE: "Square",
    SOCKETTYPE_TRIANGLE: "Triangle",
    SOCKETTYPE_POWER: "Power",
    SOCKETTYPE_SHIELD: "Shield",
    SOCKETTYPE_SWORD: "Sword",
};

/** Human-friendly flag labels */
export const FLAG_LABELS: Record<string, string> = {
    FLAG_NoAuction: "No Auction",
    FLAG_NoTrade: "No Trade",
    FLAG_CrownsOnly: "Crowns Only",
    FLAG_PVPOnly: "PvP Only",
    FLAG_ArenaOnly: "Arena Only",
};

/** Stat display formatting — which stats show as percentages */
export const PERCENTAGE_STAT_PREFIXES = [
    "Accuracy",
    "ArmorPiercing",
    "Damage",
    "ReduceDamage",
    "Healing",
    "IncHealing",
    "FishingLuck",
    "PowerPip",
    "StunResistance",
    "MaxManaPercentReduce",
];

/** Check if a stat name is a percentage stat */
export function isPercentageStat(statName: string): boolean {
    return PERCENTAGE_STAT_PREFIXES.some(
        (prefix) =>
            statName.endsWith(prefix) ||
            statName === prefix ||
            statName === "AllFishingLuck",
    );
}

/** Get human-friendly stat name */
export function formatStatName(raw: string): string {
    // Insert spaces before capital letters: "FireDamage" → "Fire Damage"
    return raw.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** All columns available in the table */
export const TABLE_COLUMNS = [
    { key: "display_name", label: "Name", sortable: true },
    { key: "item_type", label: "Type", sortable: true },
    { key: "school", label: "School", sortable: true },
    { key: "level_req", label: "Level", sortable: true },
    { key: "rarity", label: "Rarity", sortable: true },
] as const;
