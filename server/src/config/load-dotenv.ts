import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Пути к .env (html — общий, server — production systemd). */
export function resolveEnvPaths(entryFile = fileURLToPath(import.meta.url)): {
  htmlRoot: string
  serverRoot: string
  htmlEnv: string
  serverEnv: string
} {
  const runtimeDir = dirname(entryFile)
  const serverRoot = resolve(runtimeDir, '..')
  const htmlRoot = resolve(serverRoot, '..')
  return {
    htmlRoot,
    serverRoot,
    htmlEnv: resolve(htmlRoot, '.env'),
    serverEnv: resolve(serverRoot, '.env'),
  }
}

/** Загружает html/.env, затем server/.env (перекрывает). */
export function loadProjectDotenv(entryFile?: string): string[] {
  const { htmlEnv, serverEnv } = resolveEnvPaths(entryFile)
  const loaded: string[] = []

  if (existsSync(htmlEnv)) {
    loadDotenv({ path: htmlEnv })
    loaded.push(htmlEnv)
  }

  if (existsSync(serverEnv)) {
    loadDotenv({ path: serverEnv, override: true })
    loaded.push(serverEnv)
  }

  return loaded
}
