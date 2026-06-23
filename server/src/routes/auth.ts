import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  verifyCredentials,
  findUserAccessById,
  toPublicUserProfile,
  upsertUserFromCrm,
} from '../repositories/users.js'
import type { AuthUserPayload, LocalUser } from '../types/auth.js'
import { getRequestLogClient, logActivity } from '../services/activity-log.js'
import {
  fetchCrmLookupUser,
  mapCrmUserToLocalFields,
  verifyCrmSsoToken,
} from '../services/crm-auth.js'

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  clientHostname: z.string().max(255).optional(),
})

const crmSsoSchema = z.object({
  token: z.string().min(10),
})

function scheduleSsoSecret(env: { SCHEDULE_SSO_SECRET?: string, CRM_SYNC_SECRET: string }): string {
  return env.SCHEDULE_SSO_SECRET?.trim() || env.CRM_SYNC_SECRET
}

async function signInLocalUser(
  user: LocalUser,
  reply: { jwtSign: (payload: AuthUserPayload) => Promise<string> },
) {
  const profile = findUserAccessById(user.id)!
  const token = await reply.jwtSign(toJwtPayload(user))
  return { token, user: toPublicUserProfile(profile) }
}

function toJwtPayload(user: LocalUser): AuthUserPayload {
  return {
    sub: String(user.id),
    userId: user.id,
    login: user.login,
    name: user.name,
    email: user.email ?? undefined,
    role: user.role,
  }
}

function activityClientFromRequest(
  request: Parameters<typeof getRequestLogClient>[0],
  bodyHostname?: string | null,
) {
  const client = getRequestLogClient(request)
  const hostname = client.clientHostname ?? (bodyHostname?.trim() || undefined)
  return {
    ipAddress: client.ipAddress,
    clientHostname: hostname,
  }
}

export const authRoutes: FastifyPluginAsync = async app => {
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      })
    }

    const logClient = activityClientFromRequest(request, parsed.data.clientHostname)
    let user: LocalUser | null = null
    let viaCrm = false

    // CRM — источник роли (u_prem9); иначе остаётся старая роль в SQLite (например admin).
    const crmUser = await fetchCrmLookupUser(
      app.config.env,
      parsed.data.login,
      parsed.data.password,
    )
    if (crmUser) {
      user = upsertUserFromCrm(mapCrmUserToLocalFields(crmUser))
      viaCrm = true
    } else {
      user = await verifyCredentials(parsed.data.login, parsed.data.password)
    }

    if (!user) {
      logActivity(app.config.env, {
        level: 'warning',
        category: 'auth',
        action: 'auth.login_failed',
        message: `Неудачная попытка входа: ${parsed.data.login}`,
        userLogin: parsed.data.login,
        ...logClient,
      }, request.log)
      return reply.status(401).send({
        success: false,
        error: 'Invalid login or password',
      })
    }

    const profile = findUserAccessById(user.id)!
    const payload = toJwtPayload(user)
    const token = await reply.jwtSign(payload)

    logActivity(app.config.env, {
      level: 'success',
      category: 'auth',
      action: viaCrm ? 'auth.login_crm' : 'auth.login',
      message: viaCrm ? 'Вход через CRM (login)' : 'Вход (локальная учётка)',
      userId: user.id,
      userLogin: user.login,
      userName: user.name,
      ...logClient,
    }, request.log)

    return {
      success: true,
      token,
      user: toPublicUserProfile(profile),
    }
  })

  app.get(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const jwtUser = request.user as AuthUserPayload
      const profile = findUserAccessById(jwtUser.userId)
      if (!profile) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }
      return {
        success: true,
        user: toPublicUserProfile(profile),
      }
    },
  )

  // Stateless JWT: токен остаётся валидным до expiresIn, отзыва списка нет.
  app.post(
    '/auth/logout',
    { preHandler: [app.authenticate] },
    async () => ({ success: true }),
  )

  /** SSO из CRM: одноразовый токен из schedule.php (#sso=...). */
  app.post('/auth/crm-sso', async (request, reply) => {
    const parsed = crmSsoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid request body' })
    }

    const payload = verifyCrmSsoToken(
      parsed.data.token,
      scheduleSsoSecret(app.config.env),
    )
    if (!payload) {
      return reply.status(401).send({ success: false, error: 'Invalid or expired SSO token' })
    }

    const fields = mapCrmUserToLocalFields(payload)
    const user = upsertUserFromCrm(fields)
    const logClient = activityClientFromRequest(request)
    const { token, user: publicProfile } = await signInLocalUser(user, reply)

    logActivity(app.config.env, {
      level: 'success',
      category: 'auth',
      action: 'auth.crm_sso',
      message: 'Вход через CRM SSO',
      userId: user.id,
      userLogin: user.login,
      userName: user.name,
      ...logClient,
    }, request.log)

    return { success: true, token, user: publicProfile }
  })

  /** Проверка логина/пароля CRM (crm_lookup.php) и выдача JWT. */
  app.post('/auth/crm-bridge', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid request body' })
    }

    const crmUser = await fetchCrmLookupUser(
      app.config.env,
      parsed.data.login,
      parsed.data.password,
    )
    if (!crmUser) {
      return reply.status(401).send({ success: false, error: 'Invalid login or password' })
    }
    const fields = mapCrmUserToLocalFields(crmUser)
    const user = upsertUserFromCrm(fields)
    const logClient = activityClientFromRequest(request, parsed.data.clientHostname)
    const { token, user: publicProfile } = await signInLocalUser(user, reply)

    logActivity(app.config.env, {
      level: 'success',
      category: 'auth',
      action: 'auth.crm_bridge',
      message: 'Вход через CRM (логин/пароль)',
      userId: user.id,
      userLogin: user.login,
      userName: user.name,
      ...logClient,
    }, request.log)

    return { success: true, token, user: publicProfile }
  })
}
