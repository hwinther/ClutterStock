/** The TUI items panel title, e.g. `─[ items · 3 of 12 ]─` when a filter hides some. */
export function itemsPanelTitle(shown: number, total: number): string {
  const count = shown === total ? String(shown) : `${shown} of ${total}`;
  return `─[ items · ${count} ]─`;
}
