# Code Review: CRM Vue / График заместителей

**Дата:** 25 июня 2025  
**Область:** `html/` — Fastify API, Vue SPA, SQLite, интеграция с CRM  
**Методология:** Code Reviewer (корректность, безопасность, поддерживаемость, производительность, тестирование)

---

## Краткое резюме

Проект в целом построен аккуратно: параметризованные SQL-запросы, Zod-валидация на большинстве эндпоинтов, синхронизация роли из БД после JWT-проверки, защита от path traversal при работе с файлами, admin-маршруты закрыты `requireAdmin`.

**Главные риски:**

1. **IDOR** — скачивание вложений скрытых мероприятий без проверки `shouldRedactHiddenEvent`.
2. **Утечка секретов** — в репозитории лежит дамп CRM с реальными паролями в открытом виде.
3. **Слабые демо-аккаунты** — seed `manager/manager`, `user/user` создаётся и в production.
4. **Нет rate limiting** на публичных auth-эндпоинтах.
5. **SSO-токены** — повторное использование в пределах TTL.

Ниже — полный список находок с приоритетами и рекомендациями.

---

## 🔴 Blockers (обязательно исправить)

### 1. Скачивание вложений скрытых мероприятий обходит ограничения видимости

**Категория:** безопасность  
**Файлы:** `server/src/routes/attachments.ts` (147–183), `server/src/services/event-permissions.ts` (18–29), `server/src/utils/event-visibility.ts` (12–35)

**Проблема:**  
`GET /api/attachments/:id/file` проверяет только `canViewEvent()`, которая для скрытых событий **всегда возвращает `true`** (комментарий: «детали скрываются через shouldRedactHiddenEvent»). В списке/деталях события вложения маскируются через `applyEventVisibilityForProfile()`, но прямой запрос по ID вложения это обходит.

**Почему это опасно:**  
Любой аутентифицированный пользователь, знающий или подобравший ID вложения, может скачать файлы скрытого мероприятия (тема, место, состав скрыты, но файлы — нет).

**Исправление:**
```typescript
// В attachments.ts перед openStoredFile:
import { shouldRedactHiddenEvent } from '../services/event-permissions.js'

if (shouldRedactHiddenEvent(profile, event)) {
  return reply.status(404).send({ success: false, error: 'File not found' })
}
```

Добавить интеграционный тест: пользователь без доступа к скрытому событию → 404 на `/attachments/:id/file`.

---

### 2. Демо-аккаунты с предсказуемыми паролями в production

**Категория:** безопасность  
**Файл:** `server/src/db/migrate.ts` (70–119)

**Проблема:**  
`seedRoleUsers()` создаёт учётки `manager/manager`, `moderator/moderator`, `user/user` при **любом** окружении, если логин отсутствует. Production-валидация (`validateProductionSecrets`) проверяет только `SEED_USER_PASSWORD` для admin, но не блокирует demo-seed.

**Исправление:**
```typescript
function seedRoleUsers(database: Database.Database, env: Env): void {
  if (env.NODE_ENV === 'production') return
  // ...
}
```
Либо полностью вынести demo-seed в отдельный dev-скрипт (`scripts/seed-role-users.ts`).

---

### 3. CRM SSO-токены можно использовать повторно

**Категория:** безопасность  
**Файлы:** `server/src/services/crm-auth.ts` (120–143), `server/src/routes/auth.ts` (138–170)

**Проблема:**  
SSO проверяет HMAC (`timingSafeEqual`) и `exp`, но нет одноразового `jti` / server-side store. Перехваченный токен действует до истечения срока.

**Исправление:**
- CRM выдаёт токен с уникальным `jti`.
- Node сохраняет hash использованных токенов (Redis / SQLite) с TTL = exp.
- Отклонять повторное использование.

---

## 🟡 Suggestions (рекомендуется исправить)

### 4. JWT в localStorage — уязвимость к XSS

**Категория:** безопасность  
**Файлы:** `src/api/client.ts` (1–23), `src/composables/useAuth.ts`

**Проблема:**  
Токен хранится в `localStorage` (`crm_auth_token`). Любой XSS (сейчас `v-html` не используется — хорошо) или сторонний скрипт может украсть токен.

**Исправление:**  
HttpOnly + Secure + SameSite=Strict cookie с CSRF-токеном; либо короткий access token (15 мин) + refresh через httpOnly cookie.

---

### 5. SSO-токен в URL (hash/query)

**Категория:** безопасность  
**Файлы:** `src/utils/crm-sso.ts`, `src/main.ts`

**Проблема:**  
Токен передаётся через `#sso=...` или `?sso=...`. Риск попадания в историю браузера, Referer, логи прокси/аналитики. URL очищается после входа, но токен мог уже попасть в логи.

**Исправление:**  
POST redirect с одноразовым code exchange; либо только fragment + TTL ≤ 60 сек.

---

### 6. SVG-файлы разрешены и отдаются inline

**Категория:** безопасность  
**Файлы:** `server/src/services/file-storage.ts` (10–51, 89–101), `server/src/routes/attachments.ts` (172–182)

**Проблема:**  
`image/svg+xml` и `.svg` в whitelist. SVG может содержать `<script>`. Файл отдаётся с `Content-Disposition: inline` и исходным MIME.

**Исправление:**  
Запретить SVG; либо отдавать как `application/octet-stream` + `attachment`; санитизация через DOMPurify на клиенте при preview.

---

### 7. Валидация загрузки только по MIME/расширению

**Категория:** безопасность  
**Файл:** `server/src/services/file-storage.ts` (89–101)

**Проблема:**  
Нет проверки magic bytes. Можно загрузить HTML/полиглот с расширением `.pdf`.

**Исправление:**  
Библиотека `file-type` для проверки сигнатуры; опционально ClamAV.

---

### 8. Полная буферизация файла в памяти при upload

**Категория:** безопасность / производительность  
**Файл:** `server/src/routes/attachments.ts` (57)

**Проблема:**  
`await file.toBuffer()` — до 25 МБ на запрос в RAM. При параллельных загрузках — риск DoS по памяти.

**Исправление:**  
Стриминг на диск через `@fastify/multipart` без полной буферизации.

---

### 9. Прямая запись в production MySQL CRM

**Категория:** безопасность  
**Файлы:** `server/src/services/crm-users.ts`, `server/src/services/crm-participants-mysql.ts`

**Проблема:**  
Grafic API может INSERT/UPDATE таблицу `user` CRM напрямую. Компрометация admin JWT или DB-credentials = полный контроль над CRM.

**Исправление:**  
Read-only MySQL user для participants; запись — через audited CRM PHP API с ограниченными правами.

---

### 10. Fallback на локальную SQLite-аутентификацию при недоступности CRM

**Категория:** безопасность  
**Файлы:** `server/src/routes/auth.ts` (65–76), `server/src/services/crm-auth.ts` (161–168)

**Проблема:**  
Если `CRM_LOOKUP_URL` не задан или CRM недоступен, login идёт через локальный bcrypt (включая seed admin). В production с CRM это создаёт обход централизованной auth.

**Исправление:**  
В production с `CRM_MOCK=false`: fail closed при недоступности CRM; локальный login только для break-glass аккаунтов (whitelist).

---

### 11. JWT нельзя отозвать (stateless logout)

**Категория:** безопасность  
**Файл:** `server/src/routes/auth.ts` (131–136)

**Проблема:**  
`/auth/logout` не инвалидирует токен. Украденный JWT валиден до `JWT_EXPIRES_IN` (дефолт 8h). Роль из БД синхронизируется — хорошо, но сам токен остаётся.

**Исправление:**  
Blocklist (Redis/SQLite), короткий TTL + refresh, инвалидация при смене пароля.

---

### 12. Нет security headers на API и SPA

**Категория:** безопасность  
**Файлы:** `server/src/app.ts`, `deploy/nginx-grafic.admsr.ru.conf`

**Проблема:**  
Nginx ставит только HSTS. Нет CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

**Исправление:**
- API: `@fastify/helmet`
- Nginx для SPA:
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

---

### 13. CORS — одна строка origin

**Категория:** безопасность  
**Файлы:** `server/src/app.ts` (50–53), `server/src/config/env.ts` (10)

**Проблема:**  
`CORS_ORIGIN` — одна строка с `credentials: true`. Ошибка конфигурации (wildcard, лишний origin) откроет cross-origin доступ к API с cookie/credentials.

**Исправление:**  
Allowlist массивом origins; явный запрет `*` при `credentials: true`.

---

### 14. X-Forwarded-For без trustProxy

**Категория:** безопасность / корректность  
**Файлы:** `server/src/services/activity-log.ts` (27–37), `server/src/app.ts` (43–45)

**Проблема:**  
IP для аудита берётся из первого hop `X-Forwarded-For`. Fastify не настроен с `trustProxy`. Если API когда-либо будет доступен не только через nginx loopback — клиент сможет подделать IP в логах.

**Исправление:**
```typescript
const app = Fastify({ logger: ..., trustProxy: '127.0.0.1' })
```
Предпочитать `X-Real-IP` от доверенного прокси.

---

### 15. Утечка внутренних сообщений об ошибках

**Категория:** безопасность  
**Файлы:** `server/src/app.ts` (101–108), `server/src/routes/attachments.ts` (139–142), `server/src/routes/crm-users.ts` (95–97)

**Проблема:**  
500-ответы в attachments возвращают `err.message`. CRM routes отдают текст исключения (`Failed to list users`). Zod `details` на 400 может раскрывать схему.

**Исправление:**  
Клиенту — generic message; детали только в server log.

---

### 16. Заглушка crmUserHasScheduleAccess() всегда true

**Категория:** безопасность / поддерживаемость  
**Файл:** `server/src/services/crm-auth.ts` (69–77)

**Проблема:**  
Функция не используется сейчас, но всегда возвращает `true`. Опасна, если будет подключена позже.

**Исправление:**  
Реализовать проверку или удалить dead code.

---

## 💭 Nits (желательно)

### 17. Публичные health-эндпоинты

**Файл:** `server/src/routes/health.ts`  
`/api/health` без auth — минимальный риск; `/health/detailed` защищён admin.

---

### 18. Нет автоматизированных тестов

**Категория:** тестирование  
В проекте **0** файлов `*.test.ts` / `*.spec.ts`.

**Рекомендуемые тесты:**
- Матрица прав: hidden events, роли admin/manager/moderator/user
- IDOR вложений (регрессия после fix #1)
- Upload validation (отклонение запрещённых типов)
- SSO verify (valid/expired/tampered)
- SQL — smoke-тесты репозиториев

---

### 19. Логи неудачного входа содержат login

**Файл:** `server/src/routes/auth.ts` (79–86)  
Корректно для аудита; доступ только admin (`logs.ts`). OK.

---

### 20. Seed admin email `admin@local`

**Файл:** `server/src/db/migrate.ts` (64–67)  
Некритично при смене пароля в production.