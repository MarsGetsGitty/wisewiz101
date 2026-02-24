"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import type { GearItem, GearFilters, SortConfig } from "@/data/types";
import { processItems } from "@/lib/filters";

const DEFAULT_FILTERS: GearFilters = {
    search: "",
    schools: [],
    types: [],
    rarities: [],
    levelMin: 0,
    levelMax: 0,
};

export function useFilters(items: GearItem[]) {
    const [filters, setFilters] = useState<GearFilters>(DEFAULT_FILTERS);
    const [sort, setSort] = useState<SortConfig | null>(null);

    // Debounce search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const setSearch = useCallback((query: string) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: query }));
        }, 300);
    }, []);

    const toggleSchool = useCallback((school: string) => {
        setFilters((prev) => ({
            ...prev,
            schools: prev.schools.includes(school)
                ? prev.schools.filter((s) => s !== school)
                : [...prev.schools, school],
        }));
    }, []);

    const toggleType = useCallback((type: string) => {
        setFilters((prev) => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter((t) => t !== type)
                : [...prev.types, type],
        }));
    }, []);

    const toggleRarity = useCallback((rarity: string) => {
        setFilters((prev) => ({
            ...prev,
            rarities: prev.rarities.includes(rarity)
                ? prev.rarities.filter((r) => r !== rarity)
                : [...prev.rarities, rarity],
        }));
    }, []);

    const setLevelRange = useCallback((min: number, max: number) => {
        setFilters((prev) => ({ ...prev, levelMin: min, levelMax: max }));
    }, []);

    const toggleSort = useCallback((key: string) => {
        setSort((prev) => {
            if (prev?.key === key) {
                if (prev.direction === "asc") return { key, direction: "desc" };
                return null; // Remove sort on third click
            }
            return { key, direction: "asc" };
        });
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setSort(null);
    }, []);

    const filteredItems = useMemo(
        () => processItems(items, filters, sort),
        [items, filters, sort],
    );

    return {
        filters,
        sort,
        filteredItems,
        setSearch,
        toggleSchool,
        toggleType,
        toggleRarity,
        setLevelRange,
        toggleSort,
        clearFilters,
    };
}
