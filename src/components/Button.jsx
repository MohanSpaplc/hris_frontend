/**
 * <Button variant="primary|secondary|outline|ghost|danger" size="sm|lg" loading icon={Save}>Save</Button>
 */
export default function Button({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  icon: Icon,
  type = 'button',
  className = '',
  children,
  disabled,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size && `btn-${size}`,
    block && 'btn-block',
    loading && 'is-loading',
    !children && Icon && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {Icon && !loading && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  )
}
