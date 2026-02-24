export function SortArrow({ direction, isGroup2 }: { direction: "asc" | "desc", isGroup2: boolean }) {
    const colorClass = isGroup2 ? "text-primary-500" : "text-accent-500";
    return (
        <span className={`flex items-center ml-0.5 ${colorClass}`}>
            {direction === "asc" ? "▲" : "▼"}
        </span>
    );
}
