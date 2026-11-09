import { useState } from 'react'
import { toast } from 'react-toastify'
import { Save } from 'lucide-react'
import { errorMessage, fieldErrors } from '../../api/client'
import { vendorsApi } from '../../api/masters'
import Button from '../../components/Button'
import { FloatingInput } from '../../components/FloatingField'
import Modal from '../../components/Modal'
import Switch from '../../components/Switch'
import { statusIdFor } from '../../utils/status'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,30}$/

const toForm = (vendor) => ({
  name: vendor?.name ?? '',
  contact_person: vendor?.contact_person ?? '',
  email: vendor?.email ?? '',
  phone: vendor?.phone ?? '',
  is_active: vendor ? vendor.status?.code !== 'inactive' : true,
})

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter the vendor name.'
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

/** Add (vendor = null) or edit. Mounted only while open, keyed per record. */
export default function VendorFormModal({ vendor, statuses, onClose, onSaved }) {
  const isEdit = Boolean(vendor)
  const [form, setForm] = useState(() => toForm(vendor))
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

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    }
    const statusId = statusIdFor(statuses, form.is_active)
    if (statusId) payload.status_id = statusId

    setSaving(true)
    try {
      const saved = isEdit ? await vendorsApi.update(vendor.id, payload) : await vendorsApi.create(payload)
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
      title={isEdit ? 'Edit vendor' : 'Add vendor'}
      width={580}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="vendor-form" icon={Save} loading={saving}>
            {isEdit ? 'Save changes' : 'Add vendor'}
          </Button>
        </>
      }
    >
      <form id="vendor-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FloatingInput label="Vendor name" required autoFocus maxLength={200} value={form.name} onChange={update('name')} error={errors.name} />
        <FloatingInput label="Contact person" maxLength={200} value={form.contact_person} onChange={update('contact_person')} error={errors.contact_person} />
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
