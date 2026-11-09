import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Activity, History, Pencil, RefreshCw, Search, X } from 'lucide-react'
import { clientsApi } from '../../api/clients'
import { countriesApi } from '../../api/countries'
import { myActivitiesApi } from '../../api/myActivities'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { stageBadgeClass } from '../../utils/status'
import ChangeStageModal from './ChangeStageModal'
import StageHistoryModal from './StageHistoryModal'

const COLUMN_COUNT = 7

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/** /my-activities: candidates tagged to jobs; click the status to change it (with a remark). */
export default function MyActivities() {
  const { user, can } = useAuth()
  const isHr = user?.role?.code === 'hr'

  const [stages, setStages] = useState([])
  const [countries, setCountries] = useState([])
  const [clients, setClients] = useState([])
  useEffect(() => {
    let cancelled = false
    Promise.all([myActivitiesApi.stages(), countriesApi.list({ per_page: 100, sort: 'name' })])
      .then(([stageList, countryList]) => {
        if (cancelled) return
        setStages(stageList)
        setCountries(countryList.data)
      })
      .catch(() => !cancelled && toast.error('Could not load the dropdown lists.'))
    return () => {
      cancelled = true
    }
  }, [])

  const [search, setSearch] = useState('')
  const [countryId, setCountryId] = useState('')
  const [clientId, setClientId] = useState('')
  const [stageId, setStageId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  // Clients of the picked country (like the old Country → Client dropdowns).
  useEffect(() => {
    let cancelled = false
    clientsApi
      .list({ per_page: 100, sort: 'name', country_id: countryId || undefined })
      .then((data) => !cancelled && setClients(data.data))
      .catch(() => !cancelled && setClients([]))
    return () => {
      cancelled = true
    }
  }, [countryId])

  const { rows, meta, loading, reload } = usePaginatedList(
    myActivitiesApi.list,
    {
      page,
      per_page: 15,
      search: debouncedSearch || undefined,
      country_id: countryId || undefined,
      client_id: clientId || undefined,
      stage_id: stageId || undefined,
    },
    'Could not load your activities.',
  )

  const [changing, setChanging] = useState(null)
  const [viewingHistory, setViewingHistory] = useState(null)

  // TAG roles cannot change an application once it is on the HR side.
  const canChange = (application) => can('candidates.update') && (isHr || application.stage.side === 'tag')

  const hasFilters = Boolean(search || countryId || clientId || stageId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }
  const changeCountry = (event) => {
    setCountryId(event.target.value)
    setClientId('')
    setPage(1)
  }
  const clearFilters = () => {
    setSearch('')
    setCountryId('')
    setClientId('')
    setStageId('')
    setPage(1)
  }

  return (
    <div className="stack">
      <PageHeader
        title="My Activities"
        subtitle={meta ? `${meta.total} candidate${meta.total === 1 ? '' : 's'} in progress.` : 'Candidates you tagged to jobs and their status.'}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="card">
        <div className="filter-bar">
          <div className="input-group">
            <span className="input-icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              className="input"
              type="search"
              placeholder="Name, email, mobile, job code"
              aria-label="Search activities"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <select className="input" value={countryId} onChange={changeCountry} aria-label="Filter by country">
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <select className="input" value={clientId} onChange={changeFilter(setClientId)} aria-label="Filter by client">
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select className="input" value={stageId} onChange={changeFilter(setStageId)} aria-label="Filter by status" style={{ width: 200 }}>
            <option value="">All statuses</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <Button variant="ghost" icon={X} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Candidate</th>
                <th>Email Id</th>
                <th>Mobile No</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ width: 70, textAlign: 'right' }}>History</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading activities…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Activity size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No activities match your filters.' : 'No activities yet. Add a resume to a job to start.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((application) => (
                <tr key={application.id} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td>
                    <div className="mono">{application.job.job_code}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {application.job.job_title}
                      {application.job.client ? ` · ${application.job.client.name}` : ''}
                    </div>
                  </td>
                  <td>
                    <Link to={`/candidates/${application.candidate.id}`} className="job-link">
                      {application.candidate.full_name}
                    </Link>
                    <div className="mono muted">{application.candidate.candidate_code}</div>
                  </td>
                  <td>{application.candidate.email ?? <span className="muted">—</span>}</td>
                  <td className="mono">{application.candidate.phone ?? <span className="muted">—</span>}</td>
                  <td>
                    {canChange(application) ? (
                      <button
                        type="button"
                        onClick={() => setChanging(application)}
                        title="Click to change status"
                        style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span className={stageBadgeClass(application.stage)}>{application.stage.name}</span>
                        <Pencil size={12} className="muted" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className={stageBadgeClass(application.stage)}>{application.stage.name}</span>
                    )}
                  </td>
                  <td>{formatDate(application.updated_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={History}
                        onClick={() => setViewingHistory(application)}
                        aria-label={`Status history of ${application.candidate.full_name}`}
                        title="Status history"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
      </div>

      {changing && (
        <ChangeStageModal
          application={changing}
          stages={stages}
          onClose={() => setChanging(null)}
          onSaved={() => {
            setChanging(null)
            reload()
          }}
        />
      )}
      {viewingHistory && <StageHistoryModal application={viewingHistory} onClose={() => setViewingHistory(null)} />}
    </div>
  )
}
