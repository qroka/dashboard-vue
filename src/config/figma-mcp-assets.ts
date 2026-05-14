/**
 * Аватары графика: PNG из макета Figma (выпадающий список заместителей, узел 2212:3662),
 * сохранены в `public/avatars/schedule/` (раньше — с localhost Figma Desktop MCP).
 */
const schedule = (name: string) => `/avatars/schedule/${name}`

export const figmaScheduleAssets = {
  /** Участники без отдельного портрета в макете — слой из строки «Журавская» (нижний). */
  avatar: schedule('participant.png'),
  avatarMarcenkovskiy: schedule('marcenkovskiy.png'),
  avatarMarkova: schedule('markova.png'),
  avatarSidorov: schedule('sidorov.png'),
  /** В макете — композит; для UI — верхний слой. */
  avatarZhuravskaya: schedule('zhuravskaya.png'),
  avatarNigmatullin: schedule('nigmatullin.png')
} as const
