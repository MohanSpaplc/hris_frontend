import { useId } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  Strikethrough,
  Table,
  TableToolbar,
  Underline,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

// Only features the backend sanitizer keeps (see App\Support\HtmlSanitizer), so what you see is what is saved.
const EDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [Essentials, Paragraph, Heading, Bold, Italic, Underline, Strikethrough, List, Link, BlockQuote, Table, TableToolbar, Autoformat, PasteFromOffice],
  toolbar: ['heading', '|', 'bold', 'italic', 'underline', 'strikethrough', '|', 'bulletedList', 'numberedList', '|', 'link', 'blockQuote', 'insertTable', '|', 'undo', 'redo'],
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading2', view: 'h2', title: 'Heading', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Sub-heading', class: 'ck-heading_heading3' },
    ],
  },
  link: { defaultProtocol: 'https://' },
  table: { contentToolbar: ['tableColumn', 'tableRow'] },
}

/**
 * CKEditor 5 (Classic) for rich text. value / onChange use an HTML string.
 * Pass a new `key` to reset its content from outside (e.g. after reading a JD file).
 */
export default function RichTextEditor({ label, value, onChange, error, hint, placeholder = 'Write here…' }) {
  const id = useId()

  return (
    <div className={`rich-text ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="rich-text-label" id={`${id}-label`}>
          {label}
        </label>
      )}
      <CKEditor
        editor={ClassicEditor}
        config={{ ...EDITOR_CONFIG, placeholder }}
        data={value ?? ''}
        onReady={(editor) => {
          editor.editing.view.change((writer) => {
            writer.setAttribute('aria-labelledby', `${id}-label`, editor.editing.view.document.getRoot())
          })
        }}
        onChange={(_, editor) => onChange(editor.getData())}
      />
      {(error || hint) && <small className={error ? 'rich-text-error' : 'muted'}>{error || hint}</small>}
    </div>
  )
}
