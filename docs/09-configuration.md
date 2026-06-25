# Конфигурация

## Загрузка переменных окружения

Порядок (`server/src/config/load-dotenv.ts`):

1. `html/.env` (корень проекта)
2. `server/.env` (перекрывает корневой)

**Production systemd** читает только `EnvironmentFile=server/.env`, но при старте Node всё равно подгружает оба файла относительно `WorkingDirectory`.

> **Важно:** Если `CRM_MOCK=false` в `html/.env`, но в `server/.env` нет этой переменной, mock может остаться включённым из корня. Для production явно задайте `CRM_MOCK=false` в `server/.env`.

Валидация: `server/src/config/env.ts` (zod).

---

## Переменные API

### Сервер

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `NODE_ENV` | `development` | `production` включает guards |
| `PORT` | `3001` | Порт API |
| `HOST` | `0.0.0.0` | Bind address (`127.0.0.1` в prod) |
| `CORS_ORIGIN` | — | Разрешённые origin (через запятую) |

### JWT и сессии

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `JWT_SECRET` | — | ≥32 символа в production |
| `JWT_EXPIRES_IN` | `8h` | Срок cookie |
| `SCHEDULE_SSO_SECRET` | — | Опционально; иначе `CRM_SYNC_SECRET` |

### База и файлы

| Переменная | Dev | Production |
|------------|-----|------------|
| `SQLITE_PATH` | `../data/crm.sqlite` | `/var/lib/crm-schedule/crm.sqlite` |
| `UPLOAD_DIR` | `../data/uploads` | `/var/lib/crm-schedule/uploads` |
| `UPLOAD_MAX_BYTES` | `26214400` (25 МБ) | то же |

### Seed-пользователь

| Переменная | Описание |
|------------|----------|
| `SEED_USER_LOGIN` | Логин break-glass admin |
| `SEED_USER_PASSWORD` | Пароль (не `admin` в prod) |
| `SEED_USER_EMAIL` | Email (не `*@local` в prod) |
| `LOCAL_AUTH_LOGINS` | Список логинов с локальным входом (prod) |

### CRM — общие

| Переменная | Описание |
|------------|----------|
| `CRM_MOCK` | `true` — 4 демо-участника |
| `CRM_BASE_URL` | `https://crm.admsr.ru` |
| `CRM_HOST_HEADER` | Host header для запросов |
| `CRM_SYNC_SECRET` | Shared secret с CRM PHP |
| `CRM_TIMEOUT_MS` | Таймаут HTTP (5000) |

### CRM — аутентификация

| Переменная | Описание |
|------------|----------|
| `CRM_LOOKUP_URL` | `https://crm.admsr.ru/crm_lookup.php` |

### CRM — участники

| Переменная | Описание |
|------------|----------|
| `CRM_PARTICIPANTS_PATH` | `/crm_participants.php` |

Заголовок запроса: `X-Sync-Secret: <CRM_SYNC_SECRET>`.

### CRM — прямой MySQL (опционально)

| Переменная | Описание |
|------------|----------|
| `CRM_DB_HOST` | `172.17.30.42` |
| `CRM_DB_USER` | |
| `CRM_DB_PASSWORD` | |
| `CRM_DB_NAME` | `crm` |
| `CRM_DB_WRITABLE` | Разрешить POST/PATCH crm-users |

Приоритет источника участников: MySQL (если настроен) → HTTP → mock.

### Почта

| Переменная | Описание |
|------------|----------|
| `MAIL_ENABLED` | `true` / `false` |
| `MAIL_TRANSPORT` | `crm` или `sendmail` |
| `CRM_MAIL_PATH` | `/crm_send_mail.php` |
| `MAIL_FROM` | Отправитель |
| `MAIL_REPLY_TO` | Reply-To |
| `MAIL_SUBJECT_PREFIX` | Префикс темы |
| `MAIL_BLACKLIST` | Email через запятую |
| `MAIL_SENDMAIL_PATH` | Путь к sendmail |

---

## Фронтенд (Vite)

| Переменная | Файл | Описание |
|------------|------|----------|
| `VITE_BASE_PATH` | `.env.crm` | `base` для сборки (`/schedule/`) |

```bash
pnpm build:crm   # vite build --mode crm
```

---

## Шаблоны

| Файл | Назначение |
|------|------------|
| `html/.env.example` | Dev + общий шаблон |
| `html/server/.env.example` | Production systemd |
| `html/.env.crm` | Сборка для встраивания в CRM |

---

## Production checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — `openssl rand -hex 32`
- [ ] `SEED_USER_PASSWORD` — не `admin`
- [ ] `CRM_MOCK=false`
- [ ] `CRM_SYNC_SECRET` совпадает с `CRM_LOOKUP_SECRET` на CRM
- [ ] `CORS_ORIGIN=https://grafic.admsr.ru`
- [ ] `HOST=127.0.0.1` (API только через nginx)
- [ ] Каталоги `/var/lib/crm-schedule/` созданы, владелец `www-data`
- [ ] `MAIL_TRANSPORT=crm`, `crm_send_mail.php` на CRM

---

## См. также

- [Развёртывание](./10-deployment.md)
- [Интеграция с CRM](./11-crm-integration.md)
- [Устранение неполадок](./12-troubleshooting.md)
