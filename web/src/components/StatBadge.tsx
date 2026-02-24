"use client";

import { isPercentageStat, formatStatName } from "@/lib/constants";

interface StatBadgeProps {
    name: string;
    value: number;
    compact?: boolean;
}

function getStatTheme(name: string) {
    if (name.includes("Health")) return "var(--color-stat-health)";
    if (name.includes("Mana")) return "var(--color-stat-mana)";
    if (name.includes("PowerPip")) return "var(--color-stat-powerpip)";
    if (name.includes("ShadowPip")) return "var(--color-stat-shadowpip)";
    if (name.startsWith("All")) return "var(--color-school-all)";
    if (name.startsWith("Fire")) return "var(--color-school-fire)";
    if (name.startsWith("Ice")) return "var(--color-school-ice)";
    if (name.startsWith("Storm")) return "var(--color-school-storm)";
    if (name.startsWith("Myth")) return "var(--color-school-myth)";
    if (name.startsWith("Life")) return "var(--color-school-life)";
    if (name.startsWith("Death")) return "var(--color-school-death)";
    if (name.startsWith("Balance")) return "var(--color-school-balance)";

    const isPct = isPercentageStat(name);
    return isPct ? "var(--color-stat-percent)" : "var(--color-stat-flat)";
}

export function StatBadge({ name, value, compact = false }: StatBadgeProps) {
    const isPct = isPercentageStat(name);
    const displayValue = isPct ? `${value}%` : value.toString();
    const label = formatStatName(name);

    const baseColor = getStatTheme(name);
    const dynamicStyle = {
        color: baseColor,
        borderColor: `color-mix(in srgb, ${baseColor} 25%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${baseColor} 8%, transparent)`,
    };

    const compactStyle = {
        color: baseColor,
        backgroundColor: `color-mix(in srgb, ${baseColor} 12%, transparent)`,
    };

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium"
                style={compactStyle}
            >
                {displayValue}
            </span>
        );
    }

    return (
        <div
            className="flex items-center justify-between rounded border px-3 py-2"
            style={dynamicStyle}
        >
            <span className="text-sm text-foreground/70" style={{ color: "var(--color-foreground)" }}>{label}</span>
            <span className="text-sm font-bold" style={{ color: baseColor }}>
                {displayValue}
            </span>
        </div>
    );
}
