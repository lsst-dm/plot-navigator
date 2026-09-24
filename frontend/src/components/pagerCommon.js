
import { useSearchParams } from "react-router";
import { useCallback, useRef, useMemo } from "react";
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
    const raw = searchParams.get(key);

  // Keep the latest default/schema without making them deps
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const dtypeRef = useRef(dtype);
  dtypeRef.current = dtype;

  const value = useMemo(() => {
    if (raw === null) return defaultRef.current;
    const parsed = dtypeRef.current.safeParse(raw);
    return parsed.success ? parsed.data : defaultRef.current;
  }, [raw]);


  const setValue = useCallback((next, { replace = true } = {}) => {
    /* Maybe this works too?
    const coercedNext = dtype.parse(next);
    */
    setSearchParams(prev => {
      const params = new URLSearchParams(prev); // don't mutate prev
      if (next === null || next === "" || (Array.isArray(next) && next.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(next) ? next.join(",") : String(next));
      }
      return params;

      /* Old
      next === null || next === "" ? prev.delete(key) : prev.set(key, coercedNext);
      return prev;
      */
    }, { replace, preventScrollReset: true });
  }, [key, setSearchParams]);

  return [value, setValue];
}