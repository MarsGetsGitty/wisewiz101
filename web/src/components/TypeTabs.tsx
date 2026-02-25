"use client";

const TAB_ORDER = [
    { id: null, label: "All" },
    { id: "Hat", label: "Hats" },
    { id: "Robe", label: "Robes" },
    { id: "Shoes", label: "Boots" }, // Wizard101 internally calls them Shoes
    { id: "Wand", label: "Wands" },
    { id: "Athame", label: "Athames" },
    { id: "Amulet", label: "Amulets" },
    { id: "Ring", label: "Rings" },
    { id: "Deck", label: "Decks" },
] as const;

interface TypeTabsProps {
    availableTypes: string[];
    activeType: string | null; // e.g., 'Hat' or null for 'All'
    onSelectType: (type: string | null) => void;
}

export function TypeTabs({
    availableTypes,
    activeType,
    onSelectType,
}: TypeTabsProps) {
    // Only render tabs that actually exist in the fetched dataset (plus "All")
    const tabs = TAB_ORDER.filter(
        (tab) => tab.id === null || availableTypes.includes(tab.id)
    );

    return (
        <div className="flex w-full overflow-x-auto border-b border-border pb-px scrollbar-hide">
            <div className="flex min-w-max gap-1 px-1">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeType;

                    return (
                        <button
                            key={tab.id || "all"}
                            onClick={() => onSelectType(tab.id)}
                            className={`
                                relative flex items-center justify-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium transition-all
                                hover:bg-surface-800/50 
                                ${isActive
                                    ? "text-primary-500 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary-500"
                                    : "text-foreground/60 hover:text-foreground"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
