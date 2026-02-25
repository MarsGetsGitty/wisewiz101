"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface MultiRangeSliderProps {
    min: number;
    max: number;
    onChange: (minVal: number, maxVal: number) => void;
    value: [number, number];
}

export function MultiRangeSlider({ min, max, onChange, value }: MultiRangeSliderProps) {
    const defaultMin = value[0] > 0 ? value[0] : min;
    const defaultMax = value[1] > 0 ? value[1] : max;

    const [minVal, setMinVal] = useState(defaultMin);
    const [maxVal, setMaxVal] = useState(defaultMax);
    const minValRef = useRef(defaultMin);
    const maxValRef = useRef(defaultMax);
    const range = useRef<HTMLDivElement>(null);

    // Initial state reflection (if updated externally e.g. "Clear All")
    useEffect(() => {
        const nextMin = value[0] > 0 ? value[0] : min;
        const nextMax = value[1] > 0 ? value[1] : max;
        setMinVal(nextMin);
        setMaxVal(nextMax);
        minValRef.current = nextMin;
        maxValRef.current = nextMax;
    }, [value, min, max]);

    // Convert to percentage
    const getPercent = useCallback(
        (val: number) => Math.round(((val - min) / (max - min)) * 100),
        [min, max]
    );

    // Set width of the range to decrease from the left side
    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, getPercent]);

    // Set width of the range to decrease from the right side
    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxVal, getPercent]);

    // Debounce the actual onChange callback to prevent massive re-renders
    useEffect(() => {
        const handler = setTimeout(() => {
            if (minVal !== (value[0] || min) || maxVal !== (value[1] || max)) {
                onChange(minVal, maxVal);
            }
        }, 150);
        return () => clearTimeout(handler);
    }, [minVal, maxVal, onChange, value, min, max]);

    return (
        <div className="relative w-full h-8 flex items-center pt-2 pb-5 mt-1">
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                onChange={(event) => {
                    const val = Math.min(Number(event.target.value), maxVal - 1);
                    setMinVal(val);
                    minValRef.current = val;
                }}
                className="pointer-events-none absolute z-20 w-full h-0 outline-none m-0 p-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(140,120,241,0.6)]"
                style={{ appearance: "none", backgroundColor: "transparent" }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                onChange={(event) => {
                    const val = Math.max(Number(event.target.value), minVal + 1);
                    setMaxVal(val);
                    maxValRef.current = val;
                }}
                className="pointer-events-none absolute z-20 w-full h-0 outline-none m-0 p-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(140,120,241,0.6)]"
                style={{ appearance: "none", backgroundColor: "transparent" }}
            />

            <div className="relative w-full">
                <div className="absolute w-full h-1.5 rounded-full bg-surface-700 z-0"></div>
                <div
                    ref={range}
                    className="absolute h-1.5 rounded-full bg-primary-500/80 z-10"
                ></div>
            </div>

            <div className="absolute top-7 left-0 text-xs font-semibold text-foreground/80">{minVal}</div>
            <div className="absolute top-7 right-0 text-xs font-semibold text-foreground/80">{maxVal}</div>
        </div>
    );
}
