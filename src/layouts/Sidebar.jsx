import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext'
import { navigation } from './navigation'

const YEAR = new Date().getFullYear()

export default function Sidebar({ onNavigate }) {
  const { can } = useAuth()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <img src={logo} alt="SPA" />
        <div>
          <b>HRIS</b>
          <span>Seek. Perform. Achieve.</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigation.map(({ section, items }) => {
          const visibleItems = items.filter((item) => !item.permission || can(item.permission))
          if (!visibleItems.length) return null

          return (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {visibleItems.map(({ to, label, icon: Icon, badge }) => (
                <NavLink key={to} to={to} className="nav-link" title={label} onClick={onNavigate}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  {badge && <em className="nav-badge">{badge}</em>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">© {YEAR} SPA HRIS</div>
    </aside>
  )
}
