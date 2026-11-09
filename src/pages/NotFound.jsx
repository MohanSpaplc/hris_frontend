import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <h1 style={{ fontSize: 56, lineHeight: 1, color: 'var(--primary)' }}>404</h1>
        <p className="muted" style={{ margin: '8px 0 20px' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
