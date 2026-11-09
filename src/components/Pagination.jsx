import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/** Footer for Laravel paginated lists: "Showing 1–10 of 42" + Previous / Next. */
export default function Pagination({ meta, page, onPageChange, disabled = false }) {
  if (!meta || meta.total === 0) return null

  return (
    <div className="pagination">
      <span>
        Showing {meta.from}–{meta.to} of {meta.total}
      </span>
      <div className="row">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1 || disabled} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span>
          Page {meta.current_page} of {meta.last_page}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= meta.last_page || disabled} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
