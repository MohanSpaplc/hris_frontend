import { useState } from 'react'
import { toast } from 'react-toastify'
import { Save } from 'lucide-react'
import { countriesApi } from '../../api/countries'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { FloatingInput } from '../../components/FloatingField'
import Modal from '../../components/Modal'
import Switch from '../../components/Switch'

const emptyForm = {
  name: '',
  code: '',
  iso3_code: '',
  flag: '',
  currency_code: '',
  currency_name: '',
  currency_symbol: '',
  dial_code: '',
  timezone: '',
  is_active: true,
}

const toForm = (country) =>
  country
    ? Object.fromEntries(Object.keys(emptyForm).map((key) => [key, key === 'is_active' ? country.status?.code !== 'inactive' : country[key] ?? '']))
    : emptyForm

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter the country name.'
  if (!/^[A-Za-z]{2}$/.test(form.code.trim())) errors.code = 'Enter a 2-letter code, e.g. IN.'
  if (form.iso3_code && !/^[A-Za-z]{3}$/.test(form.iso3_code.trim())) errors.iso3_code = 'Enter a 3-letter code, e.g. IND.'
  if (form.currency_code && !/^[A-Za-z]{3}$/.test(form.currency_code.trim())) errors.currency_code = 'Enter a 3-letter code, e.g. INR.'
  if (form.dial_code && !/^\+[0-9]{1,4}$/.test(form.dial_code.trim())) errors.dial_code = 'Start with + then 1–4 digits, e.g. +91.'
  return errors
}

/**
 * Add (country = null) or edit (country = record) in one modal.
 * Mount it only while open (with a key per record) so the form starts fresh each time.
 */
export default function CountryFormModal({ open, country, statuses, onClose, onSaved }) {
  const isEdit = Boolean(country)
  const [form, setForm] = useState(() => toForm(country))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const update = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    // Send trimmed values; empty optional fields go as null.
    const { is_active: isActive, ...fields } = form
    const payload = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, String(value).trim() === '' ? null : String(value).trim()]),
    )
    // The switch maps to the "general" status ids (active / inactive) from the API.
    // Skipped if statuses have not loaded yet (backend then keeps the current status / defaults to Active).
    const statusId = statuses.find((status) => status.code === (isActive ? 'active' : 'inactive'))?.id
    if (statusId) payload.status_id = statusId

    setSaving(true)
    try {
      const saved = isEdit ? await countriesApi.update(country.id, payload) : await countriesApi.create(payload)
      toast.success(isEdit ? `${saved.name} updated.` : `${saved.name} added.`)
      onSaved(saved)
    } catch (error) {
      const serverErrors = fieldErrors(error)
      if (Object.keys(serverErrors).length) setErrors(serverErrors)
      else toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit country' : 'Add country'}
      width={620}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="country-form" icon={Save} loading={saving}>
            {isEdit ? 'Save changes' : 'Add country'}
          </Button>
        </>
      }
    >
      <form id="country-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FloatingInput label="Country name" required autoFocus maxLength={150} value={form.name} onChange={update('name')} error={errors.name} />
        <FloatingInput
          label="Country code"
          required
          maxLength={2}
          value={form.code}
          onChange={update('code')}
          error={errors.code}
          hint={errors.code ? undefined : 'ISO 2-letter code, e.g. IN'}
          style={{ textTransform: 'uppercase' }}
        />
        <FloatingInput
          label="ISO3 code"
          maxLength={3}
          value={form.iso3_code}
          onChange={update('iso3_code')}
          error={errors.iso3_code}
          hint={errors.iso3_code ? undefined : 'Used in job codes, e.g. IND-JAVA-00001'}
          style={{ textTransform: 'uppercase' }}
        />
        <FloatingInput label="Currency code" maxLength={3} value={form.currency_code} onChange={update('currency_code')} error={errors.currency_code} style={{ textTransform: 'uppercase' }} />
        <FloatingInput label="Currency name" maxLength={100} value={form.currency_name} onChange={update('currency_name')} error={errors.currency_name} />
        <FloatingInput label="Currency symbol" maxLength={10} value={form.currency_symbol} onChange={update('currency_symbol')} error={errors.currency_symbol} />
        <FloatingInput label="Dial code" maxLength={10} value={form.dial_code} onChange={update('dial_code')} error={errors.dial_code} inputMode="tel" />
        <FloatingInput label="Timezone" maxLength={100} value={form.timezone} onChange={update('timezone')} error={errors.timezone} hint={errors.timezone ? undefined : 'e.g. Asia/Kolkata'} list="timezone-options" />
        <FloatingInput label="Flag (emoji)" maxLength={16} value={form.flag} onChange={update('flag')} error={errors.flag} />
        <Switch
          label="Status"
          checked={form.is_active}
          onChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
          onText="Active"
          offText="Inactive"
          error={errors.status_id}
        />
        <datalist id="timezone-options">
          {(Intl.supportedValuesOf?.('timeZone') ?? []).map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </form>
    </Modal>
  )
}
