import { useRef, useState } from "react";
import Link from "next/link";

interface HoverMarqueeLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export const HoverMarqueeLink = ({ href, children, className }: HoverMarqueeLinkProps) => {
    const containerRef = useRef<HTMLAnchorElement>(null);
    const [isMarquee, setIsMarquee] = useState(false);

    const handleMouseEnter = () => {
        if (containerRef.current) {
            if (containerRef.current.scrollWidth > containerRef.current.clientWidth) {
                setIsMarquee(true);
            }
        }
    };

    return (
        <Link
            ref={containerRef}
            href={href}
            className={`${className || ""} ${isMarquee ? "hover-marquee hover-marquee-animated" : "truncate block"}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsMarquee(false)}
        >
            {children}
        </Link>
    );
};
