import { useState } from 'react'
import { toast } from 'react-toastify'
import { Save } from 'lucide-react'
import { clientManagersApi } from '../../api/clients'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { FloatingInput, FloatingSelect } from '../../components/FloatingField'
import Modal from '../../components/Modal'
import Switch from '../../components/Switch'
import { statusIdFor } from '../../utils/status'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,30}$/

const toForm = (manager) => ({
  name: manager?.name ?? '',
  client_id: manager?.client?.id ?? '',
  email: manager?.email ?? '',
  phone: manager?.phone ?? '',
  is_active: manager ? manager.status?.code !== 'inactive' : true,
})

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter the manager name.'
  if (!form.client_id) errors.client_id = 'Select a client.'
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

/** Add (manager = null) or edit. Mounted only while open, keyed per record. */
export default function ClientManagerFormModal({ manager, clients, statuses, onClose, onSaved }) {
  const isEdit = Boolean(manager)
  const [form, setForm] = useState(() => toForm(manager))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Keep the manager's current client selectable even if it has since been marked inactive.
  const clientOptions =
    manager?.client && !clients.some((c) => c.id === manager.client.id) ? [manager.client, ...clients] : clients

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
      client_id: Number(form.client_id),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    }
    const statusId = statusIdFor(statuses, form.is_active)
    if (statusId) payload.status_id = statusId

    setSaving(true)
    try {
      const saved = isEdit ? await clientManagersApi.update(manager.id, payload) : await clientManagersApi.create(payload)
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
      open
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit client manager' : 'Add client manager'}
      width={580}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="client-manager-form" icon={Save} loading={saving}>
            {isEdit ? 'Save changes' : 'Add manager'}
          </Button>
        </>
      }
    >
      <form id="client-manager-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FloatingInput label="Manager name" required autoFocus maxLength={200} value={form.name} onChange={update('name')} error={errors.name} />
        <FloatingSelect label="Client" required value={form.client_id} onChange={update('client_id')} error={errors.client_id}>
          {clientOptions.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </FloatingSelect>
        <FloatingInput label="Email" type="email" maxLength={255} autoComplete="off" value={form.email} onChange={update('email')} error={errors.email} />
        <FloatingInput label="Phone" type="tel" inputMode="tel" maxLength={30} value={form.phone} onChange={update('phone')} error={errors.phone} />
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
