/** Left toolbar open/closed preference (browser only). Cleared on logout. */
export const LEFT_TOOLBAR_OPEN_KEY = "campero-left-toolbar-open";

export function clearLeftToolbarPreference(): void {
  try {
    localStorage.removeItem(LEFT_TOOLBAR_OPEN_KEY);
  } catch {
    // ignore
  }
}
