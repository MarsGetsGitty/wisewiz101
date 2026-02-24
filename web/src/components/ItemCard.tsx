"use client";

import type { GearItem } from "@/data/types";
import { StatBadge } from "@/components/StatBadge";
import {
    SCHOOL_COLORS,
    SCHOOL_EMOJI,
    RARITY_LABELS,
    RARITY_COLORS,
    SOCKET_LABELS,
    FLAG_LABELS,
    formatStatName,
    sortStats,
} from "@/lib/constants";

interface ItemCardProps {
    item: GearItem;
}

export function ItemCard({ item }: ItemCardProps) {
    const schoolColor = SCHOOL_COLORS[item.school] || "var(--color-foreground)";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="font-display text-3xl font-bold text-accent-500 drop-shadow-[0_2px_10px_rgba(244,208,63,0.3)]">
                    {item.display_name || item.name}
                </h2>
                {item.display_name && (
                    <p className="mt-1 text-sm text-foreground/40">{item.name}</p>
                )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3">
                {item.school && (
                    <MetaChip
                        label={`${SCHOOL_EMOJI[item.school] || ""} ${item.school}`}
                        color={schoolColor}
                    />
                )}
                {item.item_type && <MetaChip label={item.item_type} />}
                {item.rarity && (
                    <MetaChip
                        label={RARITY_LABELS[item.rarity] || item.rarity}
                        color={RARITY_COLORS[item.rarity]}
                    />
                )}
                {item.level_req > 0 && <MetaChip label={`Level ${item.level_req}+`} />}
                {item.set_name && (
                    <MetaChip label={`Set: ${formatStatName(item.set_name)}`} />
                )}
            </div>

            {/* Stats */}
            {Object.keys(item.stats).length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/50">
                        Stats
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sortStats(Object.keys(item.stats)).map((name) => (
                            <StatBadge key={name} name={name} value={item.stats[name]} />
                        ))}
                    </div>
                </section>
            )}

            {/* Sockets */}
            {item.sockets.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/50">
                        Jewel Sockets
                    </h3>
                    <div className="flex gap-2">
                        {item.sockets.map((socket, i) => (
                            <span
                                key={i}
                                className="rounded border border-border bg-surface-800 px-2.5 py-1 text-xs text-foreground/70"
                            >
                                {SOCKET_LABELS[socket] || socket}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Flags */}
            {item.flags.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/50">
                        Flags
                    </h3>
                    <div className="flex gap-2">
                        {item.flags.map((flag) => (
                            <span
                                key={flag}
                                className="rounded border border-border bg-surface-800 px-2.5 py-1 text-xs text-foreground/50"
                            >
                                {FLAG_LABELS[flag] || flag}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function MetaChip({ label, color }: { label: string; color?: string }) {
    return (
        <span
            className="rounded-md border border-border bg-surface-800 px-2.5 py-1 text-xs font-medium"
            style={color ? { borderColor: color, color } : undefined}
        >
            {label}
        </span>
    );
}
