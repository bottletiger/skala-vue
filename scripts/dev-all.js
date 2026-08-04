import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const apiPath = fileURLToPath(new URL('../mock-api/server.js', import.meta.url))
const vitePath = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

const children = [
  spawn(process.execPath, [apiPath], { stdio: 'inherit' }),
  spawn(process.execPath, [vitePath], { stdio: 'inherit' }),
]

function stopChildren(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child.killed) child.kill(signal)
  }
}

process.on('SIGINT', () => {
  stopChildren('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopChildren('SIGTERM')
  process.exit(0)
})

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopChildren()
      process.exitCode = code
    }
  })
}
