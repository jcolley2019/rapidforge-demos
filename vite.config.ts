/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { leadBriefPlugin } from './src/deploy/lead-brief-plugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd()
  // The same VITE_BRIEF import.meta.env sees: the process env, else .env files.
  const viteBrief = process.env.VITE_BRIEF ?? loadEnv(mode, root, 'VITE_').VITE_BRIEF
  return {
    plugins: [react(), tailwindcss(), leadBriefPlugin(viteBrief, root)],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
