import { onScopeDispose, watchEffect, type Ref } from 'vue'

function canScrollVertically(el: HTMLElement, deltaY: number): boolean {
  const style = getComputedStyle(el)
  const overflowY = style.overflowY
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay')
    return false
  if (el.scrollHeight <= el.clientHeight)
    return false
  if (deltaY < 0)
    return el.scrollTop > 0
  if (deltaY > 0)
    return el.scrollTop + el.clientHeight < el.scrollHeight
  return false
}

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

    let node = e.target instanceof Element ? e.target : null
    while (node && node !== el) {
      if (node instanceof HTMLElement && canScrollVertically(node, e.deltaY)) {
        return
      }
      node = node.parentElement
    }

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
