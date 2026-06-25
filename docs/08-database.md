# База данных

## Обзор хранилищ

| Хранилище | Назначение | Расположение |
|-----------|------------|--------------|
| **SQLite** | События, пользователи, логи, уведомления, вложения (метаданные) | `data/crm.sqlite` (dev) / `/var/lib/crm-schedule/crm.sqlite` (prod) |
| **Файловая система** | Бинарные вложения | `data/uploads/` / `/var/lib/crm-schedule/uploads/` |
| **MySQL CRM** | Справочник сотрудников (`user`) | `172.17.30.42` (опционально прямой доступ) |

Драйвер SQLite: `better-sqlite3`, режим **WAL**.

Миграции: `server/db/migrations/`, применяются при старте API (`db/migrate.ts`).

---

## SQLite: таблицы

### `schema_migrations`

Учёт применённых миграций.

### `users`

Локальные учётные записи (синхронизируются с CRM при входе).

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PK | |
| `login` | TEXT UNIQUE | Логин (case-insensitive) |
| `password_hash` | TEXT | bcrypt |
| `name` | TEXT | ФИО |
| `email` | TEXT | |
| `role` | TEXT | admin, manager, moderator, assistant, user |
| `external_user_id` | INTEGER | CRM `user.u_id` |
| `substitute_slug` | TEXT | Привязка к заму |
| `theme_primary` | TEXT | Nuxt UI primary |
| `theme_neutral` | TEXT | Nuxt UI neutral |
| `theme_color_mode` | TEXT | light / dark |
| `auth_epoch` | INTEGER | Инвалидация JWT |
| `created_at` | TEXT | |

### `moderator_assignments`

Связь модератор → manager (см. [Права](./07-permissions.md)).

### `events`

Мероприятия графика.

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PK | |
| `substitute_slug` | TEXT | Slug зама |
| `event_date` | TEXT | `DD.MM.YYYY` |
| `time` | TEXT | `HH:MM` |
| `all_day` | INTEGER | 0/1 |
| `place_label` | TEXT | Название места |
| `place_address` | TEXT | Адрес |
| `topic` | TEXT | Тема |
| `hidden` | INTEGER | Скрытое |
| `completed` | INTEGER | Завершено |
| `creator_external_id` | INTEGER | CRM ID создателя |
| `detail_json` | TEXT | Доп. JSON |
| `created_at` | TEXT | |

Индексы: `event_date`, `substitute_slug`.

### `event_participants`

M2M: `event_id` + `external_user_id` (CRM).

### `event_attachments`

| Колонка | Описание |
|---------|----------|
| `storage_key` | Имя файла на диске |
| `mime_type` | MIME |
| `size_bytes` | Размер |

Миграция `002_attachment_storage.sql` добавила поля хранения.

### `activity_logs`

Журнал аудита.

| Колонка | Описание |
|---------|----------|
| `category` | auth, event, attachment, participant, system |
| `action` | create, update, delete, login, … |
| `message` | Текст |
| `meta_json` | Контекст (event id, diff, …) |
| `user_id` | Локальный user |
| `ip` | IP запроса |

### `notifications`

In-app уведомления.

| Колонка | Описание |
|---------|----------|
| `type` | event_created, event_updated, reminder, … |
| `title`, `body` | Текст |
| `event_id` | Связь с событием |
| `read_at` | NULL = непрочитано |

### `event_reminder_sent`

Дедупликация email-напоминаний за 5 минут (`event_id` + `external_user_id`).

### `sso_used_tokens`

Hash использованных SSO-токенов (replay protection).

### `jwt_revocations`

Отозванные JWT по `jti` + expiry.

---

## Миграции (хронология)

| Версия | Файл | Содержание |
|--------|------|------------|
| 001 | `001_init.sql` | users, events, participants, attachments |
| 002 | `002_attachment_storage.sql` | storage_key, mime, size |
| 003 | `003_activity_logs.sql` | activity_logs |
| 004 | `004_roles.sql` | Роли, moderator_assignments, external_user_id |
| 005 | `005_user_theme.sql` | Колонки темы |
| 006 | `006_assistant_role.sql` | Роль assistant |
| 007 | `007_notifications.sql` | notifications, event_reminder_sent |
| 008 | `008_sso_used_tokens.sql` | SSO replay guard |
| 009 | `009_jwt_revocations.sql` | JWT blacklist |

---

## CRM MySQL (справочно)

Схема таблицы `user`: `server/db/reference/user.sql`.

Ключевые поля для графика:

| Поле | Назначение |
|------|------------|
| `u_id` | Первичный ключ, `external_user_id` в событиях |
| `u_login` | Логин |
| `u_fio` | ФИО |
| `u_email` | Email для уведомлений |
| `u_prem9` | Роль в графике (0–4) |
| `u_is_zam` | Флаг заместителя |
| `u_zam_id` | ID зама (для помощников) |

Доп. SQL: `server/db/reference/crm_user_schedule_fields.sql`.

---

## Seed-пользователь

При первом запуске создаётся пользователь из `SEED_USER_LOGIN`, `SEED_USER_PASSWORD`, `SEED_USER_EMAIL` с ролью `admin`.

---

## Резервное копирование

Production:

```bash
cp /var/lib/crm-schedule/crm.sqlite /var/lib/crm-schedule/crm.sqlite.bak.$(date +%F)
# WAL-файлы при активном API:
cp crm.sqlite-wal crm.sqlite-shm ...
```

Автоматически: `deploy/deploy.sh` → `backup_database()`.

---

## См. также

- [Конфигурация](./09-configuration.md) — `SQLITE_PATH`, `UPLOAD_DIR`
- [Архитектура](./03-architecture.md)
