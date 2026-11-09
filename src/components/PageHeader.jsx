/**
 * Full-width page bar shown right under the top header (sticks while scrolling).
 * <PageHeader title="Countries" subtitle="..." actions={<Button>Add</Button>} />
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-bar">
      <div className="page-bar-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-bar-actions">{actions}</div>}
    </div>
  )
}
