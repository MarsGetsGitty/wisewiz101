"use client";

import { useState } from "react";
import { MultiRangeSlider } from "./MultiRangeSlider";
import {
    SCHOOL_COLORS,
    SCHOOL_EMOJI,
    RARITY_LABELS,
    RARITY_COLORS,
    SOCKET_LABELS,
    formatStatName,
} from "@/lib/constants";



interface FilterSidebarProps {
    filterOptions: {
        schools: string[];
        types: string[];
        rarities: string[];
        maxLevel: number;
    };
    activeSchools: string[];
    excludeSchools: string[];
    activeRarities: string[];
    excludeRarities: string[];
    levelMin: number;
    levelMax: number;
    onToggleSchool: (school: string) => void;
    onToggleRarity: (rarity: string) => void;
    onLevelChange: (min: number, max: number) => void;
    showStatHats: boolean;
    onToggleStatHats: () => void;
    showDeveloperGear: boolean;
    onToggleShowDeveloperGear: () => void;
    onClear: () => void;
    activeSources: string[];
    onToggleSource: (source: string) => void;
    activeSockets: string[];
    onToggleSocket: (socket: string) => void;
    setsOnly: boolean;
    onToggleSetsOnly: () => void;
}

export function FilterSidebar({
    filterOptions,
    activeSchools,
    excludeSchools,
    activeRarities,
    excludeRarities,
    levelMin,
    levelMax,
    onToggleSchool,
    onToggleRarity,
    onLevelChange,
    showStatHats,
    onToggleStatHats,
    showDeveloperGear,
    onToggleShowDeveloperGear,
    onClear,
    activeSources,
    onToggleSource,
    activeSockets,
    onToggleSocket,
    setsOnly,
    onToggleSetsOnly,
}: FilterSidebarProps) {
    const hasActiveFilters =
        activeSchools.length > 0 ||
        excludeSchools?.length > 0 ||
        activeRarities.length > 0 ||
        excludeRarities?.length > 0 ||
        activeSockets.length > 0 ||
        setsOnly ||
        levelMin > 0 ||
        levelMax > 0;

    const [isOpen, setIsOpen] = useState(false);

    return (
        <aside className="w-full shrink-0 md:w-64 md:h-full md:overflow-y-auto md:pr-2 custom-scrollbar">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded border border-border bg-surface-800 px-4 py-2.5 text-sm font-medium hover:bg-surface-700 md:hidden"
            >
                <span>Filters {hasActiveFilters && <span className="text-primary-500">(Active)</span>}</span>
                <span className="text-xl leading-none">{isOpen ? "−" : "+"}</span>
            </button>

            <div className={`mt-4 space-y-5 md:mt-0 ${isOpen ? "block" : "hidden md:block"}`}>
                {/* Clear All */}
                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="w-full rounded border border-border px-3 py-1.5 text-xs text-foreground/60 transition-colors hover:border-primary-500 hover:text-primary-500"
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
                            excluded={excludeSchools?.includes(school)}
                            color={SCHOOL_COLORS[school]}
                            onClick={() => onToggleSchool(school)}
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
                            excluded={excludeRarities?.includes(rarity)}
                            color={RARITY_COLORS[rarity]}
                            onClick={() => onToggleRarity(rarity)}
                        />
                    ))}
                </FilterSection>


                {/* Jewel Sockets */}
                <FilterSection title="Jewel Sockets">
                    {Object.entries(SOCKET_LABELS).map(([socketKey, socketLabel]) => (
                        <FilterChip
                            key={socketKey}
                            label={socketLabel}
                            active={activeSockets.includes(socketKey)}
                            onClick={() => onToggleSocket(socketKey)}
                        />
                    ))}
                </FilterSection>

                {/* Acquisition Source */}
                <FilterSection title="Acquisition Source">
                    {[
                        { id: "Crowns", title: "👑 Crowns" },
                        { id: "Drop", title: "⚔️ Drop" },
                        { id: "Crafted", title: "🔨 Crafted" },
                        { id: "Vendor", title: "💰 Vendor" },
                        { id: "PVP", title: "🛡️ PVP" },
                    ].map((src) => (
                        <FilterChip
                            key={src.id}
                            label={src.title}
                            active={activeSources?.includes(src.id)}
                            onClick={() => onToggleSource(src.id)}
                        />
                    ))}
                </FilterSection>

                {/* Level Range */}
                <FilterSection title="Level">
                    <div className="w-full px-1 mb-2">
                        <MultiRangeSlider
                            min={0}
                            max={filterOptions.maxLevel}
                            value={[levelMin || 0, levelMax || filterOptions.maxLevel]}
                            onChange={(minVal, maxVal) => onLevelChange(minVal, maxVal)}
                        />
                    </div>
                </FilterSection>

                {/* Advanced Options */}
                <FilterSection title="Advanced Options" defaultClosed>
                    <label className="flex items-center gap-2 cursor-pointer group mb-1.5 w-full">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-border bg-surface-800 transition-colors group-hover:border-primary-500">
                            <input
                                type="checkbox"
                                checked={setsOnly}
                                onChange={onToggleSetsOnly}
                                className="absolute opacity-0 cursor-pointer w-full h-full"
                            />
                            {setsOnly && (
                                <svg className="w-2.5 h-2.5 text-primary-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-foreground/80 select-none group-hover:text-foreground">Sets Only (Hide generic gear)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group mb-1.5">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-border bg-surface-800 transition-colors group-hover:border-primary-500">
                            <input
                                type="checkbox"
                                checked={showStatHats}
                                onChange={onToggleStatHats}
                                className="absolute opacity-0 cursor-pointer w-full h-full"
                            />
                            {showStatHats && (
                                <svg className="w-2.5 h-2.5 text-primary-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-foreground/80 select-none group-hover:text-foreground">Show Base Gear (*StatHat)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-border bg-surface-800 transition-colors group-hover:border-primary-500">
                            <input
                                type="checkbox"
                                checked={showDeveloperGear}
                                onChange={onToggleShowDeveloperGear}
                                className="absolute opacity-0 cursor-pointer w-full h-full"
                            />
                            {showDeveloperGear && (
                                <svg className="w-2.5 h-2.5 text-primary-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-foreground/80 select-none group-hover:text-foreground flex items-center gap-1.5">
                            Show Developer Items <span className="text-xs text-foreground/40 font-normal">(!Display, Blank)</span>
                        </span>
                    </label>
                </FilterSection>
            </div>
        </aside>
    );
}

function FilterSection({
    title,
    children,
    defaultClosed,
}: {
    title: string;
    children: React.ReactNode;
    defaultClosed?: boolean;
}) {
    if (defaultClosed) {
        return (
            <details className="group [&::-webkit-details-marker]:hidden">
                <summary className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/50 cursor-pointer list-none flex items-center justify-between hover:text-foreground/80 transition-colors">
                    {title}
                    <span className="text-lg leading-none transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-wrap gap-1.5">{children}</div>
            </details>
        );
    }

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
    excluded,
    color,
    onClick,
}: {
    label: string;
    active: boolean;
    excluded?: boolean;
    color?: string;
    onClick: () => void;
}) {
    let modeClasses = "border-border bg-surface-800 text-foreground/60 hover:border-foreground/30";
    let styleObj: React.CSSProperties | undefined = undefined;

    if (active) {
        modeClasses = "border-primary-500 bg-primary-500/20 text-foreground shadow-[0_0_8px_rgba(140,120,241,0.2)]";
        if (color) {
            styleObj = { borderColor: color, color };
        }
    } else if (excluded) {
        modeClasses = "border-red-500/50 bg-red-500/10 text-red-500 line-through opacity-80 hover:opacity-100 hover:border-red-500/80";
    }

    return (
        <button
            onClick={onClick}
            className={`rounded-md border px-2 py-1 text-xs transition-all ${modeClasses}`}
            style={styleObj}
        >
            {label}
        </button>
    );
}
