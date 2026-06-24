import { onScopeDispose, watchEffect, type Ref } from 'vue'

/** Вертикальное колесо → горизонтальный скролл (как на канбан-доске). */
export function useWheelHorizontalScroll(container: Ref<HTMLElement | null>) {
  function onWheel(e: WheelEvent) {
    const el = container.value
    if (!el)
      return

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY))
      return

    if (e.deltaY === 0)
      return

    const maxScrollLeft = el.scrollWidth - el.clientWidth
    if (maxScrollLeft <= 0)
      return

    e.preventDefault()
    el.scrollLeft += e.deltaY
  }

  const stop = watchEffect((onCleanup) => {
    const el = container.value
    if (!el)
      return
    el.addEventListener('wheel', onWheel, { passive: false })
    onCleanup(() => el.removeEventListener('wheel', onWheel))
  })

  onScopeDispose(stop)
}
