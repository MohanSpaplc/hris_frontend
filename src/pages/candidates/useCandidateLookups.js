import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { statusesApi } from '../../api/countries'
import { vendorsApi } from '../../api/masters'

const emptyLookups = { candidateStatuses: [], documentStatuses: [], vendors: [], loaded: false }

// Shared across candidate pages (list → create → view → edit) so the dropdown data is fetched once.
const CACHE_MS = 2 * 60 * 1000
let cached = null // { at, lookups }
let inFlight = null

function fetchLookups() {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.lookups)

  inFlight ??= Promise.all([statusesApi.list('candidate'), statusesApi.list('document'), vendorsApi.list({ per_page: 100, sort: 'name' })])
    .then(([candidateStatuses, documentStatuses, vendors]) => {
      const lookups = { candidateStatuses, documentStatuses, vendors: vendors.data, loaded: true }
      cached = { at: Date.now(), lookups }
      return lookups
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** Candidate + document statuses and vendors for candidate screens. */
export function useCandidateLookups() {
  const [lookups, setLookups] = useState(() => cached?.lookups ?? emptyLookups)

  useEffect(() => {
    let cancelled = false
    fetchLookups()
      .then((data) => !cancelled && setLookups(data))
      .catch(() => !cancelled && toast.error('Could not load the dropdown lists.'))
    return () => {
      cancelled = true
    }
  }, [])

  return lookups
}
