import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  FileSignature,
  Plus,
  Users,
} from 'lucide-react'
import Button from '../components/Button'
import DateInput from '../components/DateInput'
import { TextInput } from '../components/FormField'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

// Sample figures until the hiring APIs (jobs, candidates, interviews, offers) are built.
const stats = [
  { label: 'Open jobs', value: 24, trend: 12, icon: Briefcase, color: 'var(--primary)', bg: 'var(--primary-soft)' },
  { label: 'Candidates', value: 1286, trend: 8, icon: Users, color: 'var(--info)', bg: 'var(--info-s)' },
  { label: 'Interviews this week', value: 38, trend: -4, icon: CalendarClock, color: 'var(--warn)', bg: 'var(--warn-s)' },
  { label: 'Offers pending', value: 7, trend: 2, icon: FileSignature, color: 'var(--ok)', bg: 'var(--ok-s)' },
]

const pipeline = [
  ['Sourced', 420],
  ['Screening', 260],
  ['Client submission', 140],
  ['Interview', 86],
  ['Offer', 21],
  ['Joined', 12],
]

const recentApplications = [
  { name: 'Priya Sharma', job: 'Senior Java Developer', client: 'Acme Corp', stage: 'L2 Interview', status: ['Active', 'info'] },
  { name: 'Rahul Kumar', job: 'React Developer', client: 'Internal', stage: 'Offer', status: ['Offer sent', 'warn'] },
  { name: 'Anita Nair', job: 'HR Executive', client: 'Globex', stage: 'Joined', status: ['Hired', 'ok'] },
  { name: 'Vikram Rao', job: 'DevOps Engineer', client: 'Initech', stage: 'Screening', status: ['Rejected', 'err'] },
]

const upcomingInterviews = [
  { name: 'Sneha Iyer', job: 'QA Lead', time: 'Today, 11:30 AM', round: 'L1' },
  { name: 'Arjun Mehta', job: 'Data Engineer', time: 'Today, 3:00 PM', round: 'Client' },
  { name: 'Kavya Reddy', job: 'UI Designer', time: 'Tomorrow, 10:00 AM', round: 'HR' },
]

const initialsOf = (name) => name.split(' ').map((p) => p[0]).join('').slice(0, 2)

export default function Dashboard() {
  const { user } = useAuth()
  const [today] = useState(() => new Date())
  const [[from, to], setRange] = useState(() => [new Date(today.getFullYear(), today.getMonth(), 1), today])
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const maxPipeline = Math.max(...pipeline.map(([, count]) => count))

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Good to see you, {user?.first_name}</h1>
          <p>Here is what is happening in hiring.</p>
        </div>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <DateInput
            selectsRange
            startDate={from}
            endDate={to}
            onChange={(range) => setRange(range)}
            maxDate={today}
            placeholderText="Select date range"
            className="dashboard-range"
          />
          <Button icon={Plus} onClick={() => setJobModalOpen(true)}>
            New job
          </Button>
        </div>
      </div>

      <div className="grid grid-4">
        {stats.map(({ label, value, trend, icon: Icon, color, bg }) => (
          <div key={label} className="card stat">
            <div className="stat-icon" style={{ background: bg, color }}>
              <Icon size={20} />
            </div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value.toLocaleString('en-IN')}</div>
              <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
                {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(trend)}% vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Hiring pipeline</h3>
            <span className="badge badge-primary">This month</span>
          </div>
          <div className="card-body">
            {pipeline.map(([stage, count]) => (
              <div key={stage} className="pipeline-row">
                <span>{stage}</span>
                <div className="pipeline-bar">
                  <i style={{ width: `${(count / maxPipeline) * 100}%` }} />
                </div>
                <b style={{ textAlign: 'right' }}>{count}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Upcoming interviews</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          {upcomingInterviews.map((item) => (
            <div key={item.name} className="list-item">
              <span className="avatar">{initialsOf(item.name)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{item.name}</b>
                <div className="muted" style={{ fontSize: 13 }}>{item.job}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-info">{item.round}</span>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent applications</h3>
          <Button variant="secondary" size="sm" onClick={() => toast.info('Export will be available with the Applications module.')}>
            Export
          </Button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Client</th>
                <th>Stage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((row) => (
                <tr key={row.name}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <span className="avatar">{initialsOf(row.name)}</span>
                      {row.name}
                    </div>
                  </td>
                  <td>{row.job}</td>
                  <td>{row.client}</td>
                  <td>{row.stage}</td>
                  <td>
                    <span className={`badge badge-${row.status[1]}`}>{row.status[0]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title="Create job"
        footer={
          <>
            <Button variant="secondary" onClick={() => setJobModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setJobModalOpen(false)
                toast.success('Job saved (demo — Jobs API coming next).')
              }}
            >
              Save job
            </Button>
          </>
        }
      >
        <div className="stack">
          <TextInput label="Job title" required placeholder="Senior Java Developer" />
          <DateInput label="Requirement date" selected={null} onChange={() => {}} minDate={today} />
        </div>
      </Modal>
    </div>
  )
}
