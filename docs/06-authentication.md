# Аутентификация и сессии

## Обзор

Приложение поддерживает три способа входа, все они выдают **JWT в HttpOnly cookie** `crm_auth`:

| Способ | Эндпоинт | Когда используется |
|--------|----------|-------------------|
| Унифицированный login | `POST /api/auth/login` | Страница `/login` |
| CRM bridge | `POST /api/auth/crm-bridge` | Явный CRM-only вход |
| CRM SSO | `POST /api/auth/crm-sso` | Переход из меню CRM (`#sso=`) |

Локальный пароль (bcrypt в SQLite) — fallback и break-glass для seed-админа.

---

## Cookie и JWT

| Параметр | Значение |
|----------|----------|
| Имя cookie | `crm_auth` |
| Флаги | HttpOnly, Secure (production), SameSite=Lax |
| Алгоритм | HS256 (`@fastify/jwt`) |
| Срок жизни | `JWT_EXPIRES_IN` (по умолчанию `8h`) |

Payload JWT (`AuthUserPayload`):

```typescript
{
  sub: string          // user id
  userId: number
  login: string
  name: string
  email?: string
  role: UserRole
  jti: string          // для revocation
  authEpoch: number    // инвалидация при смене epoch
}
```

Реализация: `server/src/utils/auth-cookie.ts`, `server/src/routes/auth.ts`.

---

## Поток 1: Login с паролем

```text
1. Пользователь вводит login/password на /login
2. useAuth.login() → POST /api/auth/login
3. resolveLoginUser():
   a. lookupCrmUser() → crm_lookup.php
   b. Если found → upsertUserFromCrm() в SQLite
   c. Иначе если canUseLocalAuth → verifyCredentials (bcrypt)
4. reply.jwtSign() + setAuthCookie()
5. fetchMe() → GET /api/auth/me
```

### Политика локального входа

`server/src/utils/local-auth-policy.ts`:

- В **production** при доступном CRM локальный вход только для логинов из `LOCAL_AUTH_LOGINS` или seed-логина
- Seed-пользователь (`SEED_USER_*`) создаётся при первом запуске БД

---

## Поток 2: SSO из CRM

CRM (`schedule.php`) редиректит на:

```text
https://grafic.admsr.ru/#sso=<token>
```

1. `main.ts` → `consumeSsoTokenFromUrl()`
2. `loginWithCrmSso(token)` → `POST /api/auth/crm-sso`
3. Сервер:
   - Проверяет HMAC (`CRM_SYNC_SECRET` или `SCHEDULE_SSO_SECRET`)
   - Проверяет `exp` и max age 60 с от `iat`
   - `consumeSsoTokenOnce()` — защита от replay
   - `upsertUserFromCrm()` + cookie
4. `stripSsoFromUrl()` — удаление hash

Константа: `SSO_MAX_AGE_SEC = 60` в `crm-auth.ts`.

---

## Поток 3: Logout

```text
POST /api/auth/logout
  → revokeJwt(jti)        # таблица jwt_revocations
  → clearAuthCookie()
```

Фронтенд: `useAuth.logout()` + `clearSession()`.

---

## Валидация сессии на каждом запросе

`requireAuthenticatedUser()` (`auth-user.ts`):

1. Читает JWT из cookie
2. Проверяет blacklist (`jwt_revocations`)
3. Сверяет `authEpoch` с БД
4. `syncUserFromDb()` — актуальная роль и slugs

При 401 фронтенд вызывает `unauthorizedHandler` → редирект на `/login`.

---

## Маппинг CRM → локальный пользователь

При успешном CRM lookup/SSO:

| CRM поле | Локальное поле |
|----------|----------------|
| `u_id` | `external_user_id` |
| `login` | `login` |
| `fio` | `name` |
| `email` | `email` |
| `u_prem9` + `u_is_zam` + `u_zam_id` | `role`, `substitute_slug` |

Функция `mapCrmUserToRole()` в `crm-auth.ts` — см. [Права доступа](./07-permissions.md).

---

## Миграция со старых сессий

Раньше JWT хранился в `localStorage` (`crm_auth_token`). Сейчас:

- `clearLegacyAuthToken()` при старте приложения
- API принимает только cookie

---

## Production-требования

При `NODE_ENV=production` API **не запустится**, если:

- `JWT_SECRET` = `dev-only-change-before-production` или короче 32 символов
- `SEED_USER_PASSWORD` = `admin`
- `SEED_USER_EMAIL` оканчивается на `@local`

Генерация секретов:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 24   # CRM_SYNC_SECRET
```

---

## См. также

- [Права доступа](./07-permissions.md)
- [Интеграция с CRM](./11-crm-integration.md)
- [Конфигурация](./09-configuration.md)
