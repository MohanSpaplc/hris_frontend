import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { errorMessage } from '../api/client'

/**
 * Loads one page of a Laravel paginated list and refetches when `params` change.
 * const { rows, meta, loading, reload } = usePaginatedList(clientsApi.list, { page, search }, 'Could not load clients.')
 */
export function usePaginatedList(fetchPage, params, errorText = 'Could not load data.') {
  const [reloadCount, setReloadCount] = useState(0)
  const paramsKey = JSON.stringify(params)
  // Stable object that only changes when the params really change (undefined values are dropped).
  const query = useMemo(() => JSON.parse(paramsKey), [paramsKey])
  const queryKey = `${paramsKey}#${reloadCount}`

  // `result.key` remembers which query the rows belong to; while it differs we are loading.
  const [result, setResult] = useState({ key: null, rows: [], meta: null })

  useEffect(() => {
    let cancelled = false
    fetchPage(query)
      .then((data) => !cancelled && setResult({ key: queryKey, rows: data.data, meta: data.meta }))
      .catch((error) => {
        if (cancelled) return
        toast.error(errorMessage(error, errorText))
        setResult((r) => ({ ...r, key: queryKey }))
      })
    return () => {
      cancelled = true // ignore responses for an outdated query
    }
  }, [fetchPage, query, queryKey, errorText])

  return {
    rows: result.rows,
    meta: result.meta,
    loading: result.key !== queryKey,
    reload: () => setReloadCount((n) => n + 1),
  }
}
