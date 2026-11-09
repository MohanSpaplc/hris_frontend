import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { jobsApi } from '../../api/jobs'

const emptyLookups = { countries: [], practiceAreas: [], clients: [], users: [], vendors: [], jobStatuses: [], loaded: false }

// Shared across job pages (list → create → view → edit) so the dropdown data is fetched once, not on every page.
const CACHE_MS = 2 * 60 * 1000
let cached = null // { at, lookups }
let inFlight = null

function fetchLookups() {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.lookups)

  inFlight ??= jobsApi
    .formOptions()
    .then((data) => {
      const lookups = {
        jobStatuses: data.job_statuses,
        countries: data.countries,
        practiceAreas: data.practice_areas,
        clients: data.clients,
        vendors: data.vendors,
        users: data.users,
        loaded: true,
      }
      cached = { at: Date.now(), lookups }
      return lookups
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** Call after creating / editing masters elsewhere if job dropdowns must show the change immediately. */
export function clearJobLookupsCache() {
  cached = null
}

/**
 * Dropdown data for job screens in ONE request (GET /jobs/form-options):
 * active masters A–Z, job statuses, and active users when allowed.
 */
export function useJobLookups() {
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
