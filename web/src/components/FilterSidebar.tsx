"use client";

import {
    SCHOOL_COLORS,
    SCHOOL_EMOJI,
    RARITY_LABELS,
    RARITY_COLORS,
} from "@/lib/constants";

interface FilterSidebarProps {
    filterOptions: {
        schools: string[];
        types: string[];
        rarities: string[];
        maxLevel: number;
    };
    activeSchools: string[];
    activeTypes: string[];
    activeRarities: string[];
    levelMin: number;
    levelMax: number;
    onToggleSchool: (school: string) => void;
    onToggleType: (type: string) => void;
    onToggleRarity: (rarity: string) => void;
    onLevelChange: (min: number, max: number) => void;
    onClear: () => void;
}

export function FilterSidebar({
    filterOptions,
    activeSchools,
    activeTypes,
    activeRarities,
    levelMin,
    levelMax,
    onToggleSchool,
    onToggleType,
    onToggleRarity,
    onLevelChange,
    onClear,
}: FilterSidebarProps) {
    const hasActiveFilters =
        activeSchools.length > 0 ||
        activeTypes.length > 0 ||
        activeRarities.length > 0 ||
        levelMin > 0 ||
        levelMax > 0;

    return (
        <aside className="w-56 shrink-0 space-y-5">
            {/* Clear All */}
            {hasActiveFilters && (
                <button
                    onClick={onClear}
                    className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-foreground/60 transition-colors hover:border-primary-500 hover:text-primary-500"
                >
                    ✕ Clear All Filters
                </button>
            )}

            {/* School */}
            <FilterSection title="School">
                {filterOptions.schools.map((school) => (
                    <FilterChip
                        key={school}
                        label={`${SCHOOL_EMOJI[school] || ""} ${school}`}
                        active={activeSchools.includes(school)}
                        color={SCHOOL_COLORS[school]}
                        onClick={() => onToggleSchool(school)}
                    />
                ))}
            </FilterSection>

            {/* Equipment Type */}
            <FilterSection title="Type">
                {filterOptions.types.map((type) => (
                    <FilterChip
                        key={type}
                        label={type}
                        active={activeTypes.includes(type)}
                        onClick={() => onToggleType(type)}
                    />
                ))}
            </FilterSection>

            {/* Rarity */}
            <FilterSection title="Rarity">
                {filterOptions.rarities.map((rarity) => (
                    <FilterChip
                        key={rarity}
                        label={RARITY_LABELS[rarity] || rarity}
                        active={activeRarities.includes(rarity)}
                        color={RARITY_COLORS[rarity]}
                        onClick={() => onToggleRarity(rarity)}
                    />
                ))}
            </FilterSection>

            {/* Level Range */}
            <FilterSection title="Level">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={0}
                        max={filterOptions.maxLevel}
                        value={levelMin || ""}
                        placeholder="Min"
                        onChange={(e) =>
                            onLevelChange(parseInt(e.target.value) || 0, levelMax)
                        }
                        className="w-full rounded border border-border bg-surface-800 px-2 py-1 text-xs text-foreground outline-none focus:border-primary-500"
                    />
                    <span className="text-foreground/30 text-xs">—</span>
                    <input
                        type="number"
                        min={0}
                        max={filterOptions.maxLevel}
                        value={levelMax || ""}
                        placeholder="Max"
                        onChange={(e) =>
                            onLevelChange(levelMin, parseInt(e.target.value) || 0)
                        }
                        className="w-full rounded border border-border bg-surface-800 px-2 py-1 text-xs text-foreground outline-none focus:border-primary-500"
                    />
                </div>
            </FilterSection>
        </aside>
    );
}

function FilterSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/50">
                {title}
            </h3>
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </div>
    );
}

function FilterChip({
    label,
    active,
    color,
    onClick,
}: {
    label: string;
    active: boolean;
    color?: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-md border px-2 py-1 text-xs transition-all ${active
                    ? "border-primary-500 bg-primary-500/20 text-foreground shadow-[0_0_8px_rgba(140,120,241,0.2)]"
                    : "border-border bg-surface-800 text-foreground/60 hover:border-foreground/30"
                }`}
            style={active && color ? { borderColor: color, color } : undefined}
        >
            {label}
        </button>
    );
}
