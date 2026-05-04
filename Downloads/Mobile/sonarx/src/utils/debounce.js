import { useEffect, useState } from "react";
export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const normalizedDelay = Math.max(0, Number(delay) || 0);
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, normalizedDelay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
