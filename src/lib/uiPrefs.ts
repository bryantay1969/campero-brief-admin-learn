/** Left toolbar open/closed preference (browser only). */
export const LEFT_TOOLBAR_OPEN_KEY = "campero-left-toolbar-open";

export function clearLeftToolbarPreference(): void {
  try {
    localStorage.removeItem(LEFT_TOOLBAR_OPEN_KEY);
  } catch {
    // ignore
  }
}

export function setLeftToolbarOpenPreference(open: boolean): void {
  try {
    localStorage.setItem(LEFT_TOOLBAR_OPEN_KEY, open ? "1" : "0");
  } catch {
    // ignore
  }
}
