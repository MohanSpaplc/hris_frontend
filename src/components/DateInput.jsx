import DatePicker from 'react-datepicker'
import { CalendarDays } from 'lucide-react'
import 'react-datepicker/dist/react-datepicker.css'
import { FormField } from './FormField'

/**
 * Date picker styled like the other inputs (35px, 10px radius).
 * Single:  <DateInput label="Joining date" selected={date} onChange={setDate} />
 * Range:   <DateInput selectsRange startDate={from} endDate={to} onChange={([f, t]) => ...} />
 */
export default function DateInput({
  label,
  required,
  error,
  hint,
  placeholderText = 'dd MMM yyyy',
  dateFormat = 'dd MMM yyyy',
  className = '',
  ...props
}) {
  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <div className="input-group">
          <span className="input-icon">
            <CalendarDays size={16} aria-hidden="true" />
          </span>
          <DatePicker
            id={id}
            className="input"
            dateFormat={dateFormat}
            placeholderText={placeholderText}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable
            autoComplete="off"
            ariaDescribedBy={describedBy}
            ariaInvalid={error ? 'true' : undefined}
            required={required}
            {...props}
          />
        </div>
      )}
    </FormField>
  )
}
