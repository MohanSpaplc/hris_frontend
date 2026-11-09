// API status colors → badge classes in global.css
const badgeByColor = { success: 'ok', secondary: 'warn', danger: 'err', warning: 'warn', info: 'info', primary: 'primary' }

export const statusBadgeClass = (status) => `badge badge-${badgeByColor[status?.color] ?? 'info'}`

/** Id of an active / inactive status from the list returned by GET /statuses?module=general. */
export const statusIdFor = (statuses, isActive) => statuses.find((status) => status.code === (isActive ? 'active' : 'inactive'))?.id

// Hiring stage → existing badge classes: rejections red, hold / feedback amber, selected / hired green, HR side primary.
const stageBadge = {
  rejected: 'err',
  client_screen_rejected: 'err',
  client_interview_rejected: 'err',
  hr_rejected: 'err',
  backout: 'err',
  feedback_pending: 'warn',
  hold: 'warn',
  client_selected: 'ok',
  hired: 'ok',
  onboarded: 'ok',
}

export const stageBadgeClass = (stage) => `badge badge-${stageBadge[stage?.code] ?? (stage?.side === 'hr' ? 'primary' : 'info')}`
