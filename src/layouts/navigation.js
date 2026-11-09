import { Activity, Briefcase, Building2, ClipboardList, Globe2, Handshake, LayoutDashboard, Layers, Settings, UserRound, Users } from 'lucide-react'

// `permission` hides an item from roles that cannot use it.
export const navigation = [
  {
    section: 'Main',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Hiring',
    items: [
      { to: '/jobs', label: 'Jobs', icon: Briefcase, permission: 'jobs.view' },
      { to: '/assigned-jobs', label: 'Assigned Jobs', icon: ClipboardList, permission: 'jobs.view' },
      { to: '/candidates', label: 'Candidates', icon: Users, permission: 'candidates.view' },
      { to: '/my-activities', label: 'My Activities', icon: Activity, permission: 'candidates.view' },
    ],
  },
  {
    section: 'Masters',
    items: [
      { to: '/countries', label: 'Countries', icon: Globe2, permission: 'masters.view' },
      { to: '/clients', label: 'Clients', icon: Building2, permission: 'masters.view' },
      { to: '/client-managers', label: 'Client Managers', icon: UserRound, permission: 'masters.view' },
      { to: '/practice-areas', label: 'Practice Areas', icon: Layers, permission: 'masters.view' },
      { to: '/vendors', label: 'Vendors', icon: Handshake, permission: 'masters.view' },
    ],
  },
  {
    section: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
]
