"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getItemByName } from "@/data/repository";
import { ItemCard } from "@/components/ItemCard";
import type { GearItem } from "@/data/types";

export default function ItemDetailPage() {
    const params = useParams();
    const name = decodeURIComponent(params.name as string);
    const [item, setItem] = useState<GearItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const found = await getItemByName(name);
            setItem(found || null);
            setLoading(false);
        }
        load();
    }, [name]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-6">
                <Link
                    href="/"
                    className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
                >
                    ← Back to Database
                </Link>
                <div className="mt-8 rounded-lg border border-border bg-surface-900 p-6">
                    <p className="text-foreground/50">
                        Item not found: <span className="text-foreground">{name}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-6">
            <Link
                href="/"
                className="mb-6 inline-block text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
                ← Back to Database
            </Link>
            <div className="rounded-xl border border-border bg-surface-900/70 p-6 backdrop-blur-sm">
                <ItemCard item={item} />
            </div>
        </div>
    );
}
