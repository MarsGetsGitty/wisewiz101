"use client";

import { useMemo, useCallback, useRef } from "react";
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger, parseAsBoolean } from "nuqs";
import type { GearItem, SortConfig } from "@/data/types";
import { processItems } from "@/lib/filters";

export function useFilters(items: GearItem[]) {
    const [filters, setFilters] = useQueryStates({
        search: parseAsString.withDefault(""),
        schools: parseAsArrayOf(parseAsString).withDefault([]),
        excludeSchools: parseAsArrayOf(parseAsString).withDefault([]),
        types: parseAsArrayOf(parseAsString).withDefault([]),
        excludeTypes: parseAsArrayOf(parseAsString).withDefault([]),
        rarities: parseAsArrayOf(parseAsString).withDefault([]),
        excludeRarities: parseAsArrayOf(parseAsString).withDefault([]),
        levelMin: parseAsInteger.withDefault(0),
        levelMax: parseAsInteger.withDefault(0),
        sorts: parseAsArrayOf(parseAsString).withDefault([]),
        columns: parseAsArrayOf(parseAsString).withDefault([]),
        showStatHats: parseAsBoolean.withDefault(false),
    });

    const activeSorts: SortConfig[] = useMemo(() => {
        return filters.sorts.map(s => {
            const lastColon = s.lastIndexOf(":");
            const key = s.substring(0, lastColon);
            const direction = s.substring(lastColon + 1) as "asc" | "desc";
            return { key, direction };
        });
    }, [filters.sorts]);

    // Debounce search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const setSearch = useCallback(
        (query: string) => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => {
                setFilters({ search: query || null }); // null clears the param
            }, 300);
        },
        [setFilters],
    );

    const toggleSchool = useCallback(
        (school: string) => {
            let nextInc = [...filters.schools];
            let nextExc = [...filters.excludeSchools];

            if (nextInc.includes(school)) {
                // Was included, change to exclude
                nextInc = nextInc.filter((s) => s !== school);
                nextExc.push(school);
            } else if (nextExc.includes(school)) {
                // Was excluded, change to none
                nextExc = nextExc.filter((s) => s !== school);
            } else {
                // Was none, change to include
                nextInc.push(school);
            }

            setFilters({
                schools: nextInc.length > 0 ? nextInc : null,
                excludeSchools: nextExc.length > 0 ? nextExc : null,
            });
        },
        [filters.schools, filters.excludeSchools, setFilters],
    );

    const toggleType = useCallback(
        (type: string) => {
            let nextInc = [...filters.types];
            let nextExc = [...filters.excludeTypes];

            if (nextInc.includes(type)) {
                nextInc = nextInc.filter((t) => t !== type);
                nextExc.push(type);
            } else if (nextExc.includes(type)) {
                nextExc = nextExc.filter((t) => t !== type);
            } else {
                nextInc.push(type);
            }

            setFilters({
                types: nextInc.length > 0 ? nextInc : null,
                excludeTypes: nextExc.length > 0 ? nextExc : null,
            });
        },
        [filters.types, filters.excludeTypes, setFilters],
    );

    const toggleRarity = useCallback(
        (rarity: string) => {
            let nextInc = [...filters.rarities];
            let nextExc = [...filters.excludeRarities];

            if (nextInc.includes(rarity)) {
                nextInc = nextInc.filter((r) => r !== rarity);
                nextExc.push(rarity);
            } else if (nextExc.includes(rarity)) {
                nextExc = nextExc.filter((r) => r !== rarity);
            } else {
                nextInc.push(rarity);
            }

            setFilters({
                rarities: nextInc.length > 0 ? nextInc : null,
                excludeRarities: nextExc.length > 0 ? nextExc : null,
            });
        },
        [filters.rarities, filters.excludeRarities, setFilters],
    );

    const setLevelRange = useCallback(
        (min: number, max: number) => {
            setFilters({
                levelMin: min > 0 ? min : null,
                levelMax: max > 0 ? max : null,
            });
        },
        [setFilters],
    );

    const toggleSort = useCallback(
        (key: string) => {
            const currentSorts = filters.sorts || [];

            const isGroup2 = key.startsWith("stat:");
            const defaultsToDesc = isGroup2 || key === "level_req";
            const defaultDir = defaultsToDesc ? "desc" : "asc";

            let nextSorts = [...currentSorts];

            const existingIdx = nextSorts.findIndex(s => s.startsWith(key + ":"));

            if (existingIdx >= 0) {
                const currentDir = nextSorts[existingIdx].endsWith(":desc") ? "desc" : "asc";
                if (currentDir === defaultDir) {
                    nextSorts[existingIdx] = `${key}:${defaultDir === "asc" ? "desc" : "asc"}`;
                } else {
                    nextSorts.splice(existingIdx, 1);
                }
            } else {
                nextSorts = nextSorts.filter(s => {
                    const isSGroup2 = s.startsWith("stat:");
                    return isGroup2 !== isSGroup2;
                });

                nextSorts.push(`${key}:${defaultDir}`);

                nextSorts.sort((a, b) => {
                    const aIsG2 = a.startsWith("stat:");
                    const bIsG2 = b.startsWith("stat:");
                    if (!aIsG2 && bIsG2) return -1;
                    if (aIsG2 && !bIsG2) return 1;
                    return 0;
                });
            }

            setFilters({ sorts: nextSorts.length > 0 ? nextSorts : null });
        },
        [filters.sorts, setFilters],
    );

    const clearFilters = useCallback(() => {
        setFilters({
            search: null,
            schools: null,
            excludeSchools: null,
            types: null,
            excludeTypes: null,
            rarities: null,
            excludeRarities: null,
            levelMin: null,
            levelMax: null,
            sorts: null,
            columns: null,
            showStatHats: null,
        });
    }, [setFilters]);

    const toggleShowStatHats = useCallback(() => {
        setFilters((prev) => ({ showStatHats: !prev.showStatHats }));
    }, [setFilters]);

    const toggleColumn = useCallback(
        (column: string) => {
            const next = filters.columns.includes(column)
                ? filters.columns.filter((c) => c !== column)
                : [...filters.columns, column];
            setFilters({ columns: next.length > 0 ? next : null });
        },
        [filters.columns, setFilters],
    );

    const setColumns = useCallback(
        (columns: string[]) => {
            setFilters({ columns: columns.length > 0 ? columns : null });
        },
        [setFilters],
    );

    const clearColumns = useCallback(() => {
        setFilters({ columns: null });
    }, [setFilters]);

    const filteredItems = useMemo(
        () => processItems(items, filters as any, activeSorts),
        [items, filters, activeSorts],
    );

    return {
        filters,
        sorts: activeSorts,
        filteredItems,
        setSearch,
        toggleSchool,
        toggleType,
        toggleRarity,
        setLevelRange,
        toggleSort,
        toggleColumn,
        setColumns,
        clearColumns,
        clearFilters,
        toggleShowStatHats,
    };
}
