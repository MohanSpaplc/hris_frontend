import { useState } from 'react'
import { toast } from 'react-toastify'
import { Save } from 'lucide-react'
import { clientsApi } from '../../api/clients'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { FloatingInput, FloatingSelect, FloatingTextarea } from '../../components/FloatingField'
import LogoPicker from '../../components/LogoPicker'
import Modal from '../../components/Modal'
import Switch from '../../components/Switch'
import { statusIdFor } from '../../utils/status'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,30}$/

const toForm = (client) => ({
  name: client?.name ?? '',
  country_id: client?.country?.id ?? '',
  email: client?.email ?? '',
  phone: client?.phone ?? '',
  address: client?.address ?? '',
  is_active: client ? client.status?.code !== 'inactive' : true,
})

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter the client name.'
  if (!form.country_id) errors.country_id = 'Select a country.'
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

/**
 * Add (client = null) or edit (client = record).
 * Mount it only while open (with a key per record) so the form starts fresh each time.
 */
export default function ClientFormModal({ client, countries, statuses, onClose, onSaved }) {
  const isEdit = Boolean(client)
  const [form, setForm] = useState(() => toForm(client))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  // Logo changes are applied after the client itself is saved.
  const [logoFile, setLogoFile] = useState(null)
  const [logoRemoved, setLogoRemoved] = useState(false)

  // Keep the client's current country selectable even if it has since been marked inactive.
  const countryOptions =
    client?.country && !countries.some((c) => c.id === client.country.id) ? [client.country, ...countries] : countries

  const update = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    const payload = {
      name: form.name.trim(),
      country_id: Number(form.country_id),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    }
    const statusId = statusIdFor(statuses, form.is_active)
    if (statusId) payload.status_id = statusId

    setSaving(true)
    try {
      const saved = isEdit ? await clientsApi.update(client.id, payload) : await clientsApi.create(payload)
      toast.success(isEdit ? `${saved.name} updated.` : `${saved.name} added.`)

      // The client is saved at this point; a logo failure is reported but doesn't undo it.
      try {
        if (logoFile) await clientsApi.uploadLogo(saved.id, logoFile)
        else if (logoRemoved && client?.logo_url) await clientsApi.removeLogo(saved.id)
      } catch (logoError) {
        const logoMessage = fieldErrors(logoError).logo || errorMessage(logoError)
        toast.warning(`Client saved, but the logo was not updated: ${logoMessage}`)
      }

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
      open
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit client' : 'Add client'}
      width={620}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="client-form" icon={Save} loading={saving}>
            {isEdit ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      <form id="client-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="span-2">
          <LogoPicker
            label="Client logo"
            currentUrl={client?.logo_url}
            file={logoFile}
            removed={logoRemoved}
            onChange={(file) => {
              setLogoFile(file)
              setLogoRemoved(false)
            }}
            onRemove={() => {
              setLogoFile(null)
              setLogoRemoved(true)
            }}
          />
        </div>
        <FloatingInput label="Client name" required autoFocus maxLength={200} value={form.name} onChange={update('name')} error={errors.name} />
        <FloatingSelect label="Country" required value={form.country_id} onChange={update('country_id')} error={errors.country_id}>
          {countryOptions.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name} ({country.code})
            </option>
          ))}
        </FloatingSelect>
        <FloatingInput label="Email" type="email" maxLength={255} autoComplete="off" value={form.email} onChange={update('email')} error={errors.email} />
        <FloatingInput label="Phone" type="tel" inputMode="tel" maxLength={30} value={form.phone} onChange={update('phone')} error={errors.phone} />
        <div className="span-2">
          <FloatingTextarea label="Address" maxLength={1000} value={form.address} onChange={update('address')} error={errors.address} />
        </div>
        <Switch
          label="Status"
          checked={form.is_active}
          onChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
          onText="Active"
          offText="Inactive"
          error={errors.status_id}
        />
      </form>
    </Modal>
  )
}
