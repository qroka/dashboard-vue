# Фронтенд

## Стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| Vue | 3.5 | UI framework |
| Vite | 7 | Сборка и dev-сервер |
| Vue Router | 5 | Маршрутизация (file-based) |
| Nuxt UI | 4 | Компоненты, тема, Tailwind |
| TypeScript | 6 | Типизация |

Конфигурация сборки: `vite.config.ts`.

---

## Маршрутизация

Маршруты генерируются из `src/pages/` плагином `vue-router/vite`:

| Файл | URL | Layout | Meta |
|------|-----|--------|------|
| `pages/index.vue` | `/` | default | — |
| `pages/[substitute].vue` | `/:substitute` | default | — |
| `pages/login.vue` | `/login` | blank | `public: true` |
| `pages/logs.vue` | `/logs` | default | `requiresAdmin` |
| `pages/customers.vue` | `/customers` | default | редирект → `/` |
| `pages/home.vue` | `/home` | — | редирект → `/` |

Layouts подключаются через `vite-plugin-vue-layouts` (`virtual:generated-layouts`).

### Guards (`src/main.ts`)

1. `authBootstrap` — `fetchMe()` до первого перехода
2. Неавторизованный → `/login?redirect=...`
3. Авторизованный на `/login` → `/`
4. `/logs` без `canViewLogs` → `/`
5. `/customers` всегда → `/`

---

## Layouts

### `layouts/default.vue`

Основной каркас:

- Боковая панель: навигация по графикам (общий + 5 замов)
- Пункт «Журнал» (admin)
- Toolbar: уведомления, меню пользователя
- `<RouterView />` для контента

### `layouts/blank.vue`

Минимальный layout для страницы входа.

---

## Ключевые компоненты

### График — `components/schedule/`

| Компонент | Назначение |
|-----------|------------|
| `SubstitutesScheduleView.vue` | Главная сетка: дни × время, CRUD, drag-scroll |
| `ScheduleEventSlideover.vue` | Форма создания/редактирования |
| `ScheduleEventCard.vue` | Карточка события в ячейке |
| `ScheduleParticipantChips.vue` | Участники |
| `ScheduleAttachmentsPopover.vue` | Вложения |

Composable `useScheduleApi` связывает UI с `api/events.ts` и `api/schedule-mapper.ts`.

### Журнал — `components/logs/`

- `ActivityLogEntryCard.vue` — карточка записи аудита
- Страница `pages/logs.vue` + `useActivityLogs`

### Уведомления — `components/notifications/`

- Slideover в toolbar
- `useNotifications` → `api/notifications.ts`

---

## Composables

| Composable | Файл | Назначение |
|------------|------|------------|
| `useAuth` | `useAuth.ts` | Сессия, login/logout, SSO, `fetchMe` |
| `usePermissions` | `usePermissions.ts` | `canEditSubstituteSlug`, `isAdmin` |
| `useScheduleApi` | `useScheduleApi.ts` | Загрузка/сохранение событий |
| `useParticipants` | `useParticipants.ts` | Поиск участников CRM |
| `useActivityLogs` | `useActivityLogs.ts` | Журнал (admin) |
| `useNotifications` | `useNotifications.ts` | In-app уведомления |
| `useThemePreferences` | `useThemePreferences.ts` | Тема Nuxt UI |
| `useDragScroll` | `useDragScroll.ts` | Горизонтальный drag по графику |
| `useWheelHorizontalScroll` | `useWheelHorizontalScroll.ts` | Shift+wheel → горизонталь |

---

## HTTP-клиент

`src/api/client.ts`:

```typescript
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',  // JWT cookie
  })
  // ...
}
```

- Базовый путь: относительный `/api/...` (nginx или Vite proxy)
- При 401 вызывается `unauthorizedHandler` → редирект на login
- Устаревший `localStorage` токен удаляется при старте

### Доменные модули API

| Модуль | Эндпоинты |
|--------|-----------|
| `events.ts` | CRUD `/api/events` |
| `attachments.ts` | Upload/download/delete |
| `logs.ts` | `GET /api/logs` |
| `notifications.ts` | Список, read/read-all |
| `crm-users.ts` | Админка CRM-пользователей |
| `theme.ts` | `GET/PUT /api/user/theme` |

---

## Конфигурация графика

`src/config/schedule.ts`:

- `scheduleTitleOptions` — пункты навигации (ФИО, аватары)
- `scheduleSubstituteSlugs` — тип `ScheduleSubstituteSlug`
- `scheduleNavbarHeading(slug)` — заголовок страницы
- `substituteAccentBySlug` — цветовые акценты Nuxt UI

---

## SSO из CRM

`src/utils/crm-sso.ts`:

1. При загрузке `main.ts` читает `#sso=<token>` из URL
2. Вызывает `loginWithCrmSso(token)` → `POST /api/auth/crm-sso`
3. Удаляет hash из адресной строки (`stripSsoFromUrl`)

Токен выдаётся CRM (`schedule.php`) при переходе по ссылке из меню CRM.

---

## Сборка

```bash
pnpm build          # dist/ — корень сайта
pnpm build:crm      # --mode crm, base /schedule/
```

Переменная `VITE_BASE_PATH` в `.env.crm` задаёт `base` для встраивания в подкаталог CRM.

### Dev proxy

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

---

## Типизация маршрутов

Файл `src/route-map.d.ts` генерируется при сборке (`vue-router/vite`). Не редактируйте вручную — при деплое скрипт `deploy.sh` сбрасывает локальные изменения.

---

## См. также

- [API](./05-api-reference.md)
- [Права доступа](./07-permissions.md)
- [Быстрый старт](./02-getting-started.md)
