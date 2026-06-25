# Справочник API

Базовый URL: `/api` (в production — `https://grafic.admsr.ru/api`).

## Общие соглашения

### Аутентификация

Защищённые эндпоинты требуют cookie `crm_auth` (JWT, HttpOnly). В запросах используйте `credentials: 'include'`.

### Формат ответа

Успех:

```json
{
  "success": true,
  "data": { ... }
}
```

Ошибка:

```json
{
  "success": false,
  "error": "Описание ошибки"
}
```

HTTP-коды: `400` (валидация), `401` (не авторизован), `403` (нет прав), `404`, `429` (rate limit), `500`.

### Rate limiting

Публичные эндпоинты health и auth ограничены по IP (см. `@fastify/rate-limit` в route-модулях).

---

## Health

### `GET /api/health`

Проверка доступности API.

**Аутентификация:** не требуется.

**Ответ `200`:**

```json
{
  "ok": true,
  "timestamp": "2026-06-25T12:00:00.000Z"
}
```

### `GET /api/health/detailed`

Статус БД и режима CRM mock.

**Аутентификация:** admin.

---

## Аутентификация

### `POST /api/auth/login`

Унифицированный вход: сначала CRM lookup, затем локальный bcrypt (если разрешено).

**Тело запроса:**

```json
{
  "login": "ivanov",
  "password": "secret"
}
```

**Ответ `200`:** Set-Cookie `crm_auth` + профиль пользователя.

**Ошибки:**

| Код | Причина |
|-----|---------|
| `400` | Невалидное тело |
| `401` | Неверные учётные данные |
| `503` | CRM недоступен, локальный вход запрещён |

### `POST /api/auth/crm-bridge`

Вход только через CRM `crm_lookup.php`.

### `POST /api/auth/crm-sso`

Вход по одноразовому SSO-токену из hash URL.

**Тело:**

```json
{
  "token": "<base64url.payload.signature>"
}
```

Токен: HMAC-SHA256, max age 60 с, одноразовый.

### `GET /api/auth/me`

Текущий пользователь и `editableSubstituteSlugs`.

**Аутентификация:** cookie.

**Ответ `200`:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "login": "admin",
    "name": "Администратор",
    "role": "admin",
    "editableSubstituteSlugs": ["marcenkovskiy", "markova", "sidorov", "zhuravskaya", "nigmatullin"]
  }
}
```

### `POST /api/auth/logout`

Отзыв JWT (blacklist `jti`) и очистка cookie.

---

## Мероприятия

### `GET /api/events`

Список мероприятий с учётом прав и redaction скрытых.

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `eventDate` | `DD.MM.YYYY` | Фильтр по дате |
| `substituteSlug` | string | Фильтр по заму |

**Аутентификация:** обязательна.

### `GET /api/events/:id`

Одно мероприятие с участниками и вложениями.

### `POST /api/events`

Создание мероприятия.

**Тело запроса:**

```json
{
  "substituteSlug": "marcenkovskiy",
  "eventDate": "25.06.2026",
  "time": "10:00",
  "allDay": false,
  "placeLabel": "Кабинет",
  "placeAddress": "ул. Московская, 72",
  "topic": "Совещание",
  "hidden": false,
  "completed": false,
  "creatorExternalId": 42,
  "participantIds": [42, 108],
  "detail": {}
}
```

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `substituteSlug` | да | Slug зама |
| `eventDate` | да | Формат `DD.MM.YYYY` |
| `topic` | да | Тема |
| `time` | нет | По умолчанию `09:00` |
| `allDay` | нет | Событие на весь день |
| `hidden` | нет | Скрытое мероприятие |
| `participantIds` | нет | ID из CRM `user.u_id` |
| `detail` | нет | Произвольный JSON |

**Права:** `canEditSubstituteSlug` для указанного slug.

### `PATCH /api/events/:id`

Частичное обновление (те же поля, все опциональны).

### `DELETE /api/events/:id`

Удаление + отмена связанных уведомлений.

---

## Участники (CRM)

### `GET /api/participants`

Список или поиск сотрудников.

**Query:**

| Параметр | Описание |
|----------|----------|
| `q` | Поиск по ФИО |
| `ids` | `1,2,3` — выборка по ID |

**Ответ включает `source`:** `mock` | `http` | `mysql`.

### `GET /api/participants/:id`

Один участник по CRM ID.

---

## Вложения

### `POST /api/events/:eventId/attachments`

Multipart upload.

**Ограничения:** размер ≤ `UPLOAD_MAX_BYTES` (25 МБ по умолчанию); проверка MIME через magic bytes.

### `GET /api/attachments/:id/file`

Скачивание файла.

**Query:** `download=1` — Content-Disposition: attachment.

### `DELETE /api/attachments/:id`

Удаление вложения и файла с диска.

---

## Журнал действий

### `GET /api/logs`

**Аутентификация:** admin.

**Query:**

| Параметр | Описание |
|----------|----------|
| `category` | `auth`, `event`, `attachment`, `participant`, `system` |
| `limit` | Число записей |
| `offset` | Смещение |
| `userId` | Фильтр по пользователю |
| `from`, `to` | ISO-даты |

---

## Уведомления

### `GET /api/notifications`

In-app уведомления текущего пользователя.

### `POST /api/notifications/read-all`

Отметить все прочитанными.

### `POST /api/notifications/:id/read`

Отметить одно прочитанным.

---

## Тема пользователя

### `GET /api/user/theme`

Настройки Nuxt UI (primary, neutral, colorMode).

### `PUT /api/user/theme`

**Тело:**

```json
{
  "primary": "green",
  "neutral": "zinc",
  "colorMode": "light"
}
```

---

## CRM-пользователи (admin)

### `GET /api/crm-users/meta`

Метаданные полей, список замов.

### `GET /api/crm-users`

Список пользователей CRM.

### `GET /api/crm-users/:id`

Детали пользователя.

### `POST /api/crm-users`

Создание (только при `CRM_DB_WRITABLE=true`).

### `PATCH /api/crm-users/:id`

Обновление (в т.ч. `u_prem9` — роль в графике).

---

## Примеры curl

Вход и список событий:

```bash
# Вход
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin"}'

# События на дату
curl -b cookies.txt \
  "http://localhost:3001/api/events?eventDate=25.06.2026&substituteSlug=marcenkovskiy"

# Создание
curl -b cookies.txt -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "substituteSlug": "marcenkovskiy",
    "eventDate": "25.06.2026",
    "time": "14:00",
    "topic": "Тестовое совещание",
    "participantIds": []
  }'
```

---

## См. также

- [Аутентификация](./06-authentication.md)
- [Права доступа](./07-permissions.md)
- [Интеграция с CRM](./11-crm-integration.md)
