import { Outlet } from 'react-router-dom'
import { Briefcase, FileSignature, ShieldCheck, Users } from 'lucide-react'
import logo from '../assets/logo.png'
import '../styles/auth.css'

const YEAR = new Date().getFullYear()

export default function AuthLayout() {
  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="auth-logo">
          <img src={logo} alt="SPA" />
          <div>
            <b>HRIS</b>
            <span>Seek. Perform. Achieve.</span>
          </div>
        </div>

        <div className="auth-hero">
          <h1>Hire the right people, faster.</h1>
          <p>One place for jobs, resumes, interviews and offer letters.</p>
          <ul className="auth-points">
            <li>
              <span><Briefcase size={18} /></span> Track every job requirement and client
            </li>
            <li>
              <span><Users size={18} /></span> Resume bank with full candidate history
            </li>
            <li>
              <span><FileSignature size={18} /></span> Offer letters with approvals
            </li>
            <li>
              <span><ShieldCheck size={18} /></span> Role-based secure access
            </li>
          </ul>
        </div>

        <div className="auth-copy">© {YEAR} SPA. All rights reserved.</div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <img src={logo} alt="SPA" />
          </div>
          <Outlet />
        </div>
      </section>
    </div>
  )
}
