"use client";

import { useState, useEffect } from "react";
import type { GearItem } from "@/data/types";
import { getAllItems, getFilterOptions } from "@/data/repository";

interface UseGearDataResult {
    items: GearItem[];
    loading: boolean;
    error: string | null;
    filterOptions: {
        schools: string[];
        types: string[];
        rarities: string[];
        maxLevel: number;
    };
}

export function useGearData(): UseGearDataResult {
    const [items, setItems] = useState<GearItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterOptions, setFilterOptions] = useState({
        schools: [] as string[],
        types: [] as string[],
        rarities: [] as string[],
        maxLevel: 0,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getAllItems();
                if (cancelled) return;
                setItems(data);
                setFilterOptions(getFilterOptions(data));
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return { items, loading, error, filterOptions };
}
