/**
 * Run `init` on every page load — the initial load and each <ClientRouter />
 * navigation. `astro:page-load` already fires on the initial load, so callers
 * must not also invoke `init` directly (that double-binds every listener).
 *
 * The signal aborts right before the next page swap. Pass it to any listener
 * attached to `document`/`window` (or to an observer) so they don't pile up
 * across navigations.
 */
export function onPageLoad(init: (signal: AbortSignal) => void) {
  let controller: AbortController | null = null

  document.addEventListener('astro:page-load', () => {
    controller?.abort()
    controller = new AbortController()
    init(controller.signal)
  })

  document.addEventListener('astro:before-swap', () => {
    controller?.abort()
    controller = null
  })
}
