import { Construction } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="card card-body" style={{ textAlign: 'center', padding: '56px 24px' }}>
      <Construction size={40} color="var(--muted)" style={{ marginBottom: 12 }} />
      <h2>{title}</h2>
      <p className="muted">This module is coming soon.</p>
    </div>
  )
}
