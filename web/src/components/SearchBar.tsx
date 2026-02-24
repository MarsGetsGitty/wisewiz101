"use client";

interface SearchBarProps {
    onSearch: (query: string) => void;
    resultCount: number;
    totalCount: number;
}

export function SearchBar({
    onSearch,
    resultCount,
    totalCount,
}: SearchBarProps) {
    return (
        <div className="relative">
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    placeholder="Search gear by name..."
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full rounded border border-border bg-surface-800 py-2.5 pl-10 pr-4 text-foreground placeholder:text-foreground/30 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                />
            </div>
            <p className="mt-2 text-xs text-foreground/40">
                {resultCount === totalCount
                    ? `${totalCount.toLocaleString()} items`
                    : `${resultCount.toLocaleString()} of ${totalCount.toLocaleString()} items`}
            </p>
        </div>
    );
}
