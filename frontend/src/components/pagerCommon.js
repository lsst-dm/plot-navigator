
import { useSearchParams } from "react-router";
import { useCallback } from "react";

/*
 * Stores state like useState(), but write values to the query string to
 * preserve values across navigation.
 */
export function useQueryParam(key, defaultValue = "") {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback((next, { replace = true } = {}) => {
    setSearchParams(prev => {
      next === null || next === "" ? prev.delete(key) : prev.set(key, next);
      return prev;
    }, { replace, preventScrollReset: true });
  }, [key, setSearchParams]);

  return [value, setValue];
}