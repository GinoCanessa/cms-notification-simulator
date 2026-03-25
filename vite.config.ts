import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Inlines the favicon as a data URI during build so the single HTML file is fully self-contained
function inlineFavicon() {
  return {
    name: 'inline-favicon',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        const faviconPath = resolve(__dirname, 'public/favicon.svg')
        try {
          const svg = readFileSync(faviconPath)
          const dataUri = `data:image/svg+xml;base64,${svg.toString('base64')}`
          return html.replace(
            /href="\/favicon\.svg"/,
            `href="${dataUri}"`,
          )
        } catch {
          return html
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineFavicon(), viteSingleFile()],
})
