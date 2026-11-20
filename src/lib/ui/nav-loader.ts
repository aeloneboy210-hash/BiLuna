/** Forms with this attribute show the loading screen when submitted (they move to another page). */
export const LOADER_ATTR = 'data-page-loader'

/** True when a click on a link will open a different page of BiLuna in this tab. */
export function isPageChange(c: {
  href: string
  current: string
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  target?: string | null
  download?: boolean
}): boolean {
  if (c.button !== 0 || c.metaKey || c.ctrlKey || c.shiftKey || c.altKey) return false
  if (c.download || (c.target && c.target !== '_self')) return false
  let to: URL
  let from: URL
  try {
    to = new URL(c.href, c.current)
    from = new URL(c.current)
  } catch {
    return false
  }
  if (to.origin !== from.origin) return false
  return to.pathname !== from.pathname || to.search !== from.search
}
