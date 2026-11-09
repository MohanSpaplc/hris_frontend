import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import '../styles/layout.css'
import Header from './Header'
import Sidebar from './Sidebar'

const isMobile = () => window.matchMedia('(max-width: 991px)').matches

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => (isMobile() ? setMobileOpen((open) => !open) : setCollapsed((c) => !c))

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <Sidebar onNavigate={() => setMobileOpen(false)} />
      <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className="app-main">
        <Header onToggleSidebar={toggleSidebar} isToggled={isMobile() ? mobileOpen : collapsed} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
