
import { useSearchParams } from "react-router";
import { useCallback } from "react";
import { z } from "zod";

/*
 * Stores state like useState(), but write values to the query string to
 * preserve values across navigation.
 *
 * Pass a zod type as dtype for inputs to be either validated or coerced to the
 * desired type.
 */
export function useQueryParam(key, defaultValue = "", dtype = z.any()) {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputValue = dtype.safeParse(searchParams.get(key) ?? defaultValue)
  const value = inputValue.success ? inputValue.data : defaultValue;

  const setValue = useCallback((next, { replace = true } = {}) => {
    const coercedNext = dtype.parse(next);
    setSearchParams(prev => {
      next === null || next === "" ? prev.delete(key) : prev.set(key, coercedNext);
      return prev;
    }, { replace, preventScrollReset: true });
  }, [key, setSearchParams]);

  return [value, setValue];
}