/** A full page load. Unlike router.push, it throws away everything the browser tab has cached. */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

/** A full page load that also replaces the current history entry. */
export function hardReplace(path: string) {
  window.location.replace(path);
}
