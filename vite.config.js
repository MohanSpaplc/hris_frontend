import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev only: pre-bundle these big packages once, so the job form does not load hundreds of separate files.
  optimizeDeps: {
    include: ['ckeditor5', '@ckeditor/ckeditor5-react', 'react-datepicker', 'dompurify'],
  },
  server: {
    port: 5173,
    // Dev only: forward /api to Laravel so the browser sees one origin (no CORS needed locally).
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
