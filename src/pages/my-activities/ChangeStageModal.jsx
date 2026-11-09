import { useState } from 'react'
import { toast } from 'react-toastify'
import { errorMessage, fieldErrors } from '../../api/client'
import { myActivitiesApi } from '../../api/myActivities'
import Button from '../../components/Button'
import { FormField } from '../../components/FormField'
import Modal from '../../components/Modal'
import { stageBadgeClass } from '../../utils/status'

/** Change the status (hiring stage) of one application, with a required remark. */
export default function ChangeStageModal({ application, stages, onClose, onSaved }) {
  const [stageId, setStageId] = useState(String(application.stage.id))
  // The current status is pre-selected; keep it in the list even when it is not one this user can pick.
  const options = stages.some((stage) => stage.id === application.stage.id) ? stages : [application.stage, ...stages]
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const localErrors = {}
    if (Number(stageId) === application.stage.id) localErrors.stage_id = 'Please select a different status.'
    if (!remarks.trim()) localErrors.remarks = 'Please write a remark.'
    setErrors(localErrors)
    if (Object.keys(localErrors).length) return

    setSaving(true)
    try {
      const updated = await myActivitiesApi.changeStage(application.id, { stage_id: Number(stageId), remarks: remarks.trim() })
      toast.success(`Status changed to ${updated.stage.name}.`)
      onSaved(updated)
    } catch (error) {
      const serverErrors = fieldErrors(error)
      setErrors(serverErrors)
      if (!Object.keys(serverErrors).length) toast.error(errorMessage(error, 'Could not change the status.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Change Status – ${application.candidate.full_name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <div>
          Current status: <span className={stageBadgeClass(application.stage)}>{application.stage.name}</span>
        </div>
        <FormField label="New status" required error={errors.stage_id}>
          {(id, describedBy) => (
            <select id={id} className="input" value={stageId} onChange={(e) => setStageId(e.target.value)} aria-describedby={describedBy}>
              {options.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Remarks" required error={errors.remarks}>
          {(id, describedBy) => (
            <textarea
              id={id}
              className="input"
              rows={3}
              maxLength={1000}
              placeholder="Why is the status changing?"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </FormField>
      </div>
    </Modal>
  )
}
