# Права доступа

## Локальные роли

Роли хранятся в SQLite `users.role`:

| Роль | Метка в UI | Описание |
|------|------------|----------|
| `admin` | Администратор | Полный доступ ко всем графикам и журналу |
| `manager` | Заместитель | Редактирование своего графика |
| `assistant` | Помощник заместителя | Редактирование графика «своего» зама |
| `moderator` | Модератор | Редактирование назначенных графиков |
| `user` | Исполнитель | Только просмотр |

Миграция ролей: `server/db/migrations/004_roles.sql`, `006_assistant_role.sql`.

---

## CRM: поле `u_prem9`

В CRM MySQL таблица `user`, поле **`u_prem9`** — уровень доступа к графику:

| Значение | Константа | Метка | Локальная роль |
|----------|-----------|-------|----------------|
| 0 | `CRM_SCHEDULE_ROLE_EXECUTOR` | Исполнитель | `user` |
| 1 | `CRM_SCHEDULE_ROLE_VIEWER` | Руководитель | `user` |
| 2 | `CRM_SCHEDULE_ROLE_ADMIN` | Администратор | `admin` |
| 3 | `CRM_SCHEDULE_ROLE_DEPUTY` | Заместитель | `manager` |
| 4 | `CRM_SCHEDULE_ROLE_ASSISTANT` | Помощник заместителя | `assistant` |

Константы: `server/src/constants/crm-schedule-access.ts`.

Функция `hasScheduleAccess()` проверяет, что `u_prem9` ∈ {0,1,2,3,4}.

---

## Маппинг ролей (`mapCrmUserToRole`)

```typescript
// server/src/services/crm-auth.ts (упрощённо)
if (u_prem9 === 2) return 'admin'
if (u_prem9 === 3) return 'manager'
if (u_prem9 === 4) return 'assistant'
if (u_prem9 === 0 || u_prem9 === 1) return 'user'
// fallback: substituteSlugFromCrmUser → manager
```

Дополнительно для `manager` и `assistant` вычисляется `substitute_slug` по логину, `u_is_zam`, `u_zam_id` (`crm-login-slugs.ts`).

---

## Editable substitute slugs

Поле `editableSubstituteSlugs` в профиле пользователя (`GET /api/auth/me`) определяет, какие графики можно редактировать.

| Роль | Slugs |
|------|-------|
| `admin` | Все 5 замов |
| `manager` | Свой `substitute_slug` |
| `assistant` | Slug зама, к которому привязан (`u_zam_id`) |
| `moderator` | Slugs назначенных manager'ов (`moderator_assignments`) |
| `user` | `[]` (пусто) |

Реализация: `server/src/repositories/users.ts` → `findUserAccessById()`.

---

## Права на мероприятия

Сервис `event-permissions.ts`:

### `canViewEvent`

Все авторизованные видят событие в сетке (включая скрытые).

### `shouldRedactHiddenEvent`

Скрытое мероприятие (`hidden: true`) **редактируется** в UI как плашка без деталей, если:

- пользователь не admin;
- не может редактировать slug зама;
- не участник и не создатель.

Участники и создатели видят полные детали скрытых событий.

### `canEditSubstituteSlug` / `canEditEvent`

- `admin` — любой валидный slug
- `user` — никогда
- остальные — slug ∈ `editableSubstituteSlugs`

### Фильтрация списка

`filterEventsForProfile()` убирает события, которые пользователь не может видеть (редкий случай).

---

## Права на маршруты SPA

| Маршрут | Условие |
|---------|---------|
| `/login` | Публичный |
| `/`, `/:substitute` | Авторизован |
| `/logs` | `role === 'admin'` (`canViewLogs`) |
| `/customers` | Заблокирован (редирект) |

Guard: `src/main.ts` → `router.beforeEach`.

---

## Права на API

| Middleware | Условие |
|------------|---------|
| `app.authenticate` | Валидный JWT cookie |
| `app.requireAdmin` | `role === 'admin'` |

Эндпоинты с `requireAdmin`: `/api/logs`, `/api/crm-users/*`, `/api/health/detailed`.

Запись в CRM (`POST/PATCH /api/crm-users`) дополнительно требует `CRM_DB_WRITABLE=true`.

---

## Модераторы

Таблица `moderator_assignments`:

```sql
moderator_user_id → manager_user_id
```

Модератор получает `editableSubstituteSlugs` от всех привязанных manager'ов.

---

## Фронтенд

`usePermissions()`:

```typescript
canEditSubstituteSlug(slug)  // slug ∈ user.editableSubstituteSlugs
canEditSchedule(slug)        // slug != null && canEditSubstituteSlug
isReadOnly                   // role === 'user'
```

Компонент графика скрывает кнопки редактирования при `!canEditSchedule(currentSlug)`.

---

## См. также

- [Аутентификация](./06-authentication.md)
- [API: мероприятия](./05-api-reference.md#мероприятия)
- [Интеграция с CRM](./11-crm-integration.md)
