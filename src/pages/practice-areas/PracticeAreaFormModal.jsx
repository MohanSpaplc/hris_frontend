import { useState } from 'react'
import { toast } from 'react-toastify'
import { Save } from 'lucide-react'
import { errorMessage, fieldErrors } from '../../api/client'
import { practiceAreasApi } from '../../api/masters'
import Button from '../../components/Button'
import { FloatingInput, FloatingSelect } from '../../components/FloatingField'
import Modal from '../../components/Modal'
import Switch from '../../components/Switch'
import { statusIdFor } from '../../utils/status'

const toForm = (area) => ({
  name: area?.name ?? '',
  code: area?.code ?? '',
  head_id: area?.head?.id ?? '',
  is_active: area ? area.status?.code !== 'inactive' : true,
})

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter the practice area name.'
  if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) errors.code = 'Use letters, numbers, - or _ only, e.g. JAVA.'
  return errors
}

/** Add (area = null) or edit. Mounted only while open, keyed per record. */
export default function PracticeAreaFormModal({ area, users, statuses, onClose, onSaved }) {
  const isEdit = Boolean(area)
  const [form, setForm] = useState(() => toForm(area))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Keep the current head selectable even if they are no longer in the active-user list.
  const headOptions = area?.head && !users.some((u) => u.id === area.head.id) ? [{ ...area.head, inactive: true }, ...users] : users

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
      code: form.code.trim().toUpperCase(),
      head_id: form.head_id && form.head_id !== 'none' ? Number(form.head_id) : null,
    }
    const statusId = statusIdFor(statuses, form.is_active)
    if (statusId) payload.status_id = statusId

    setSaving(true)
    try {
      const saved = isEdit ? await practiceAreasApi.update(area.id, payload) : await practiceAreasApi.create(payload)
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
      title={isEdit ? 'Edit practice area' : 'Add practice area'}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="practice-area-form" icon={Save} loading={saving}>
            {isEdit ? 'Save changes' : 'Add practice area'}
          </Button>
        </>
      }
    >
      <form id="practice-area-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <FloatingInput label="Practice area name" required autoFocus maxLength={150} value={form.name} onChange={update('name')} error={errors.name} />
        <FloatingInput
          label="Code"
          required
          maxLength={50}
          value={form.code}
          onChange={update('code')}
          error={errors.code}
          hint={errors.code ? undefined : 'Short unique code, e.g. JAVA'}
          style={{ textTransform: 'uppercase' }}
        />
        <div className="span-2">
          <FloatingSelect label="Practice head" value={form.head_id} onChange={update('head_id')} error={errors.head_id}>
            <option value="none">— No head —</option>
            {headOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? `${user.first_name} ${user.last_name ?? ''}`.trim()} {user.email ? `· ${user.email}` : ''}
                {user.inactive ? ' (inactive)' : ''}
              </option>
            ))}
          </FloatingSelect>
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
