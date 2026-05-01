import { useEffect, useState } from 'react';
export function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}
