import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const PROGRESS_FILE = path.resolve(import.meta.dirname, 'data/progress.json')

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Dev-only API for persisting learning progress to a local JSON file,
// since this app is only ever run locally by a single user.
function progressApiPlugin() {
  return {
    name: 'progress-api',
    configureServer(server) {
      server.middlewares.use('/api/progress', async (req, res) => {
        if (req.method === 'GET') {
          try {
            const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(raw)
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('{}')
          }
          return
        }
        if (req.method === 'POST') {
          try {
            const body = await readBody(req)
            JSON.parse(body) // validate before writing
            fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true })
            fs.writeFileSync(PROGRESS_FILE, body)
            res.statusCode = 204
            res.end()
          } catch (err) {
            res.statusCode = 400
            res.end(String(err))
          }
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), progressApiPlugin()],
})
