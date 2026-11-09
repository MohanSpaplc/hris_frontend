import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Bell, ChevronDown, KeyRound, LogOut, Menu, Moon, Search, Sun, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/useTheme'

function initials(user) {
  return `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
}

export default function Header({ onToggleSidebar, isToggled }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    toast.success('You have been logged out.')
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        aria-pressed={isToggled}
      >
        {/* Default ☰; after clicking it shows ✕ until clicked again */}
        {isToggled ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="header-search input-group">
        <span className="input-icon">
          <Search size={16} aria-hidden="true" />
        </span>
        <input className="input" type="search" placeholder="Search jobs, candidates, offers…" aria-label="Search" />
      </div>

      <div className="header-actions">
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => toast.info('No new notifications.')}>
          <Bell size={18} />
          <span className="dot" />
        </button>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="avatar">{initials(user)}</span>
            <span className="user-text">
              <b>
                {user?.first_name} {user?.last_name}
              </b>
              <small>{user?.role?.name}</small>
            </span>
            <ChevronDown size={16} className="muted" />
          </button>

          {menuOpen && (
            <div className="dropdown" role="menu">
              <div className="dropdown-head">
                <b>
                  {user?.first_name} {user?.last_name}
                </b>
                <small>{user?.email}</small>
              </div>
              <button type="button" className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                <User size={16} /> My profile
              </button>
              <button type="button" className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                <KeyRound size={16} /> Change password
              </button>
              <button type="button" className="dropdown-item danger" role="menuitem" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
