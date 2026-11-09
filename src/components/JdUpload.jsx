import { useId, useRef, useState } from 'react'
import { Download, FileText, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import Button from './Button'
import { FloatingWrapper } from './FloatingField'

const ALLOWED = ['pdf', 'docx', 'xlsx', 'txt']
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Drop / choose a JD file. onFile(file) is called after a quick type/size check.
 * `fileName` shows the chosen or saved file; `reading` shows progress while the server reads it.
 */
export default function JdUpload({ fileName, reading, onFile, onRemove, onDownload, error, label = 'Upload JD', description = 'Fills the form automatically', allowed = ALLOWED }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState('')

  const accept = (file) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(extension)) {
      setLocalError(extension === 'doc' || extension === 'xls' ? 'Old .doc / .xls files: save as .docx / .xlsx first.' : `Allowed file types: ${typeList}.`)
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('The file must be 5 MB or smaller.')
      return
    }
    setLocalError('')
    onFile(file)
  }

  const message = localError || error
  const typeList = allowed.map((type) => type.toUpperCase()).join(', ')
  const hint = reading ? 'Reading the file…' : `${description ? `${description} · ` : ''}${typeList} · max 5 MB`

  return (
    <FloatingWrapper id={inputId} label={label} error={message} hint={hint} filled>
      {(describedBy) => (
        <div
          className={`input jd-upload ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            accept(e.dataTransfer.files?.[0])
          }}
        >
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={allowed.map((type) => `.${type}`).join(',')}
            className="sr-only"
            aria-describedby={describedBy}
            onChange={(e) => {
              accept(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {fileName ? <FileText size={15} className="jd-upload-icon" /> : <UploadCloud size={15} className="jd-upload-icon" />}
          <span className={`jd-upload-name ${fileName ? '' : 'is-empty'}`} title={fileName || undefined} onClick={() => inputRef.current?.click()}>
            {fileName || 'Choose or drop a file'}
          </span>
          {fileName && onDownload && (
            <Button variant="ghost" size="sm" icon={Download} onClick={onDownload} aria-label="Download file" title="Download" />
          )}
          {fileName && onRemove && (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={onRemove} aria-label="Remove file" title="Remove" style={{ color: 'var(--err)' }} />
          )}
          <Button variant="secondary" size="sm" icon={reading ? Sparkles : UploadCloud} onClick={() => inputRef.current?.click()} loading={reading}>
            {fileName ? 'Replace' : 'Browse'}
          </Button>
        </div>
      )}
    </FloatingWrapper>
  )
}
