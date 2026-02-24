"use client";

import { isPercentageStat, formatStatName } from "@/lib/constants";

interface StatBadgeProps {
    name: string;
    value: number;
    compact?: boolean;
}

export function StatBadge({ name, value, compact = false }: StatBadgeProps) {
    const isPct = isPercentageStat(name);
    const displayValue = isPct ? `${value}%` : value.toString();
    const label = formatStatName(name);

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${isPct
                        ? "bg-stat-percent/10 text-stat-percent"
                        : "bg-stat-flat/10 text-stat-flat"
                    }`}
            >
                {displayValue}
            </span>
        );
    }

    return (
        <div
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isPct
                    ? "border-stat-percent/20 bg-stat-percent/5"
                    : "border-stat-flat/20 bg-stat-flat/5"
                }`}
        >
            <span className="text-sm text-foreground/70">{label}</span>
            <span
                className={`text-sm font-bold ${isPct ? "text-stat-percent" : "text-stat-flat"
                    }`}
            >
                {displayValue}
            </span>
        </div>
    );
}
