import { fileURLToPath } from 'node:url'
import { loadProjectDotenv } from './config/load-dotenv.js'
import { loadEnv } from './config/env.js'
import { buildApp } from './app.js'
import { logActivity } from './services/activity-log.js'
import { startEventReminderWorker } from './services/event-reminder-worker.js'

const loadedEnvFiles = loadProjectDotenv(fileURLToPath(import.meta.url))

async function main() {
  const env = loadEnv()
  const app = await buildApp(env)
  const stopReminders = startEventReminderWorker(app.log)

  app.addHook('onClose', async () => {
    stopReminders()
  })

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    logActivity(env, {
      level: 'info',
      category: 'system',
      action: 'system.start',
      message: 'Запуск API CRM Vue',
    }, app.log)
    app.log.info(`CRM API listening on http://${env.HOST}:${env.PORT}`)
    app.log.info(`SQLite: ${env.SQLITE_PATH}`)
    if (loadedEnvFiles.length)
      app.log.info(`Env files: ${loadedEnvFiles.join(', ')}`)
    else
      app.log.warn('No .env file loaded (using process.env / defaults)')
    app.log.info(`CRM participants mock: ${env.CRM_MOCK}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

main()
