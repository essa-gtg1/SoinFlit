import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SOINFLIT_ROOT pins the project root to its real path when a launcher runs inside a
// virtualised folder (e.g. the Claude desktop app's session workspace). Unset elsewhere.
const root = process.env.SOINFLIT_ROOT

export default defineConfig({
  root,
  // GitHub Pages serves the site from /<repo-name>/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  resolve: root ? { preserveSymlinks: true } : {},
})
