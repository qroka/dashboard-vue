import type { Env } from '../config/env.js'
import type { LocalUser } from '../types/auth.js'
import { collectEmailAddresses } from '../utils/parse-emails.js'
import { CrmParticipantsService } from './crm-participants.js'
import { CrmUsersService } from './crm-users.js'

/** Адреса получателя: локальная БД + u_email/u_info/u_notes из CRM (как calendar2_email). */
export async function resolveNotificationEmails(
  env: Env,
  user: LocalUser,
): Promise<string[]> {
  const sources: Array<string | null | undefined> = [user.email]

  if (user.externalUserId) {
    const externalUserId = user.externalUserId

    await Promise.all([
      (async () => {
        try {
          const crmUser = await new CrmUsersService(env).getById(externalUserId, false)
          if (crmUser)
            sources.push(crmUser.email, crmUser.info, crmUser.notes)
        } catch {
          // SQL-дамп или недоступный MySQL — дополним из участников CRM ниже
        }
      })(),
      (async () => {
        try {
          const participant = await new CrmParticipantsService(env).getById(externalUserId)
          if (participant?.email)
            sources.push(participant.email)
          if (participant?.notes)
            sources.push(participant.notes)
        } catch {
          // нет адреса в CRM
        }
      })(),
    ])
  }

  return collectEmailAddresses(sources)
}
