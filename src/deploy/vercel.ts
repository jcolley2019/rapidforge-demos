import { spawn } from 'node:child_process'
import { join } from 'node:path'

/**
 * Runs the pinned Vercel CLI (node_modules/vercel) through node, so no
 * shell is involved on any platform and the env object is passed as-is.
 */

export interface RunResult {
  code: number
  stdout: string
  stderr: string
}

export interface RunOptions {
  cwd: string
  env?: NodeJS.ProcessEnv
  /** Written to the child's stdin, then closed. */
  input?: string
  /** Echo the child's output as it arrives (it is captured either way). */
  echo?: boolean
}

export function vercelBin(root: string): string {
  return join(root, 'node_modules', 'vercel', 'dist', 'index.js')
}

export function vercel(root: string, args: string[], opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [vercelBin(root), ...args], {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      stdio: [opts.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString()
      if (opts.echo) process.stdout.write(d)
    })
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString()
      if (opts.echo) process.stderr.write(d)
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
    if (opts.input !== undefined) child.stdin?.end(opts.input)
  })
}
