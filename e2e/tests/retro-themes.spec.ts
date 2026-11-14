import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { uniqueSuffix } from './helpers'
import type { HomePage } from './pages/home-page'

// The retro themes (TUI, Windows 98, CDE) swap in their own components: the TUI item table, inline
// detail/edit strip, room combobox and terminal, and the Windows 98 folder tree. The other specs run on
// the default theme only (HomePage.goto clears localStorage["cs-theme"]), so these drive the theme
// toggle in the header and exercise each theme's own views.

test.describe.configure({ mode: 'serial' })

type ThemeLabel = 'SYS' | 'TUI' | 'W98' | 'CDE'

interface Fixture {
  location: string
  room: string
  item: string
  category: string
}

function themeToggle(page: Page): Locator {
  return page.locator('button.theme-toggle')
}

// Click the header's theme toggle (it cycles SYS → TUI → W98 → CDE) until it shows `label`.
async function switchTheme(page: Page, label: ThemeLabel, dataTheme: string | null): Promise<void> {
  for (let i = 0; i < 4; i++) {
    if ((await themeToggle(page).textContent())?.includes(`[${label}]`)) break
    await themeToggle(page).click()
  }
  await expect(themeToggle(page)).toContainText(`[${label}]`)
  const html = page.locator('html')
  if (dataTheme) await expect(html).toHaveAttribute('data-theme', dataTheme)
  else await expect(html).not.toHaveAttribute('data-theme', /.+/)
}

// A location with one room holding one item, all with unique names, created through the sidebar's
// "New location" chain (location → room → item) on the default theme.
async function createFixture(home: HomePage): Promise<Fixture> {
  const fixture: Fixture = {
    location: uniqueSuffix('Retro Loc'),
    room: uniqueSuffix('Retro Room'),
    item: uniqueSuffix('Retro Item'),
    category: uniqueSuffix('Retro Cat'),
  }
  await home.goto()
  await home.page.getByRole('button', { name: 'New location' }).click()
  await home.newLocationPanel.expectVisible()
  await home.newLocationPanel.nameInput.fill(fixture.location)
  await home.newLocationPanel.button('Create location').click()

  await home.newRoomPanel.expectVisible()
  await home.newRoomPanel.nameInput.fill(fixture.room)
  await home.newRoomPanel.button('Create room').click()

  await home.newItemPanel.expectVisible()
  await home.newItemPanel.fillForm({ name: fixture.item, category: fixture.category })
  await home.newItemPanel.button('Create item').click()
  await home.itemsTable.expectRowVisible(fixture.item, { timeout: 15_000 })
  // See HomePage.createItem: the panel doesn't always move on by itself.
  if (await home.newItemPanel.isVisible()) await home.newItemPanel.cancel()
  if (await home.viewPanel.isVisible()) await home.viewPanel.close()
  return fixture
}

// Back to the inline edit form after a save. Saving normally returns the strip to the detail view,
// but the fetcher can skip its `submitting` state (see HomePage.createItem), leaving the form open.
async function reopenEdit(page: Page, row: Locator): Promise<void> {
  const edit = page.locator('form.tui-edit')
  const detail = page.locator('.tui-detail:not(.tui-edit)')
  if (await edit.isVisible()) return
  if (!(await detail.isVisible())) await row.click()
  await detail.getByRole('button', { name: '[e]dit' }).click()
  await expect(edit).toBeVisible()
}

test.describe('TUI theme', () => {
  test('table, detail strip, inline edit with the room combobox, and delete', async ({ home, page }) => {
    const f = await createFixture(home)
    await switchTheme(page, 'TUI', 'tui')

    const row = (name: string) => page.locator('.tui-table-row', { hasText: name })
    await expect(page.locator('.tui-table-head')).toContainText('NAME')
    await row(f.item).click()
    await expect(row(f.item)).toHaveAttribute('data-selected', 'true')

    // Detail strip (read-only).
    const detail = page.locator('.tui-detail:not(.tui-edit)')
    await expect(detail.locator('.tui-panel-title')).toContainText('detail · #')
    await expect(detail).toContainText(f.item)
    await expect(detail).toContainText(f.room)

    // `e` switches the strip to the inline edit form.
    await page.keyboard.press('e')
    const edit = page.locator('form.tui-edit')
    await expect(edit.locator('.tui-panel-title')).toContainText('edit · #')
    const nameInput = edit.locator('input[name="name"]')
    await expect(nameInput).toHaveValue(f.item)

    // Esc cancels back to the detail strip.
    await nameInput.press('Escape')
    await expect(edit).toBeHidden()
    await expect(detail).toBeVisible()

    await detail.getByRole('button', { name: '[e]dit' }).click()
    await expect(edit).toBeVisible()

    // An empty name is caught before the request.
    await nameInput.fill('   ')
    await edit.getByRole('button', { name: /save/ }).click()
    await expect(edit.locator('.tui-edit-error')).toContainText('name is required')

    // Room combobox: keyboard navigation, Esc closes without choosing, Enter picks.
    const combo = edit.getByRole('button', { name: 'Room' })
    await expect(combo).toContainText(f.room)
    await combo.focus()
    await combo.press('ArrowDown')
    const list = edit.getByRole('listbox')
    await expect(list).toBeVisible()
    await expect(list).toContainText(`── ${f.location} ──`)
    await combo.press('ArrowDown')
    await combo.press('k')
    await combo.press('End')
    await combo.press('Home')
    await combo.press('Escape')
    await expect(list).toBeHidden()
    await expect(combo).toContainText(f.room)
    await combo.press('Enter')
    await expect(list).toBeVisible()
    await combo.press('Tab')
    await expect(list).toBeHidden()
    // Mouse: open, hover and pick our room again.
    await combo.click()
    const option = list.getByRole('option', { name: f.room })
    await option.hover()
    await expect(option).toHaveAttribute('data-highlighted', 'true')
    await option.click()
    await expect(list).toBeHidden()
    await expect(combo).toContainText(f.room)

    // Ctrl+S saves.
    const edited = `${f.item} (tui)`
    await nameInput.fill(edited)
    await nameInput.press('Control+s')
    await expect(row(edited)).toBeVisible({ timeout: 15_000 })

    // Delete from the edit form (confirm dialog).
    await reopenEdit(page, row(edited))
    page.once('dialog', (dialog) => dialog.accept())
    await edit.getByRole('button', { name: '[d] delete' }).click()
    await expect(row(edited)).toBeHidden({ timeout: 15_000 })
  })

  test('terminal commands', async ({ home, page }) => {
    const f = await createFixture(home)
    await switchTheme(page, 'TUI', 'tui')

    await page.getByRole('button', { name: 'Open terminal' }).click()
    const terminal = page.getByRole('region', { name: 'Terminal' })
    const input = terminal.getByRole('textbox', { name: 'Command' })
    await expect(input).toBeFocused()
    await expect(terminal).toContainText("type 'help' for commands")

    const run = async (command: string) => {
      await input.fill(command)
      await input.press('Enter')
    }

    await run('help')
    await expect(terminal).toContainText('available commands:')
    await run('whoami')
    await expect(terminal).toContainText(/username\s*:/)
    await run('list rooms')
    await expect(terminal).toContainText('LOCATION')
    await expect(terminal.locator('.tui-terminal-line').filter({ hasText: /^\d+ rooms?$/ })).toHaveCount(1)
    await run('list items')
    await expect(terminal).toContainText('CATEGORY')
    await expect(terminal.locator('.tui-terminal-line').filter({ hasText: /^\d+ items?$/ })).toHaveCount(1)
    await run('list')
    await expect(terminal).toContainText('usage: list rooms | list items')

    // filter narrows the table (and opens the search bar with the same text).
    await run(`filter ${f.item}`)
    await expect(terminal).toContainText(`filter set: "${f.item}"`)
    await expect(page.locator('.tui-table-row')).toHaveCount(1)
    await expect(page.locator('.tui-table-row')).toContainText(f.item)
    await run('filter')
    await expect(terminal).toContainText(`filter cleared (was "${f.item}")`)
    await run('filter')
    await expect(terminal).toContainText('filter is empty')

    await run('frobnicate')
    await expect(terminal).toContainText('unknown command: frobnicate')

    await run('clear')
    await expect(terminal.locator('.tui-terminal-line')).toHaveCount(0)

    await run('exit')
    await expect(terminal).toBeHidden()

    // Esc and the [x] button close it too.
    await page.getByRole('button', { name: 'Open terminal' }).click()
    await input.press('Escape')
    await expect(terminal).toBeHidden()
    await page.getByRole('button', { name: 'Open terminal' }).click()
    await terminal.getByRole('button', { name: 'Close terminal' }).click()
    await expect(terminal).toBeHidden()

    // Clean up from the detail strip ([d]elete there needs no confirmation).
    await page.locator('.tui-table-row', { hasText: f.item }).click()
    await page.locator('.tui-detail').getByRole('button', { name: '[d]elete' }).click()
    await expect(page.locator('.tui-table-row', { hasText: f.item })).toBeHidden({ timeout: 15_000 })
  })

  test('account panel opens from the header chip and closes with Esc', async ({ home, page }) => {
    await home.goto()
    await switchTheme(page, 'TUI', 'tui')

    await page.getByRole('button', { name: 'Account', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Account' })
    await expect(panel.locator('.tui-panel-title')).toContainText('user ·')
    await expect(panel).toContainText(/username\s*:/)
    await expect(panel.getByRole('button', { name: '[s] sign out' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()

    await page.getByRole('button', { name: 'Account', exact: true }).click()
    await panel.getByRole('button', { name: '[Esc] close' }).click()
    await expect(panel).toBeHidden()
  })
})

test.describe('Windows 98 and CDE themes', () => {
  test('folder tree filters by room and category; chrome follows the selection', async ({ home, page }) => {
    const f = await createFixture(home)
    await switchTheme(page, 'W98', 'win98')

    const tree = page.locator('.win98-tree')
    const treeRow = (text: string) => tree.locator('.win98-tree-row', { hasText: text })
    await expect(tree).toContainText('clutter:stock')

    // Selecting a room filters the table and shows its path in the address and status bars.
    const roomRow = treeRow(`${f.room} (1)`)
    await roomRow.click()
    await expect(roomRow).toHaveClass(/win98-tree-row--selected/)
    await home.itemsTable.expectRowCount(1)
    await home.itemsTable.expectRowVisible(f.item)
    await expect(page.locator('.win98-addressbar')).toContainText(`C:\\ClutterStock\\${f.location}\\${f.room}`)
    await expect(page.locator('.win98-statusbar')).toContainText(`${f.location}\\${f.room}`)
    await expect(page.locator('.win98-statusbar')).toContainText('1 object(s)')
    await roomRow.click()
    await expect(roomRow).not.toHaveClass(/win98-tree-row--selected/)

    // Same for a category.
    const categoryRow = treeRow(`${f.category} (1)`)
    await categoryRow.click()
    await expect(categoryRow).toHaveClass(/win98-tree-row--selected/)
    await home.itemsTable.expectRowCount(1)
    await categoryRow.click()

    // Collapsing: the location (chevron, then icon to expand), the categories, and the root.
    const locationRow = treeRow(f.location).first()
    await locationRow.locator('.win98-tree-chevron').click()
    await expect(roomRow).toBeHidden()
    await locationRow.locator('.win98-tree-icon').click()
    await expect(roomRow).toBeVisible()

    await tree.getByRole('button', { name: /Categories/ }).click()
    await expect(categoryRow).toBeHidden()
    await tree.getByRole('button', { name: /Categories/ }).click()
    await expect(categoryRow).toBeVisible()

    await tree.locator('.win98-tree-row').first().locator('.win98-tree-chevron').click()
    await expect(locationRow).toBeHidden()
    await tree.locator('.win98-tree-row').first().locator('.win98-tree-chevron').click()
    await expect(locationRow).toBeVisible()

    // The location's ＋ opens the new-room panel for it.
    await locationRow.getByTitle('New room').click()
    await home.newRoomPanel.expectVisible()
    await home.newRoomPanel.cancel()

    // CDE: its foot row's Add opens the new-item panel.
    await switchTheme(page, 'CDE', 'cde')
    await page.locator('.cde-footrow').getByRole('button', { name: 'Add' }).click()
    await home.newItemPanel.expectVisible()
    await home.newItemPanel.cancel()

    // Back to the default theme, and clean up.
    await switchTheme(page, 'SYS', null)
    await home.openItemByName(f.item)
    await home.deleteCurrentItem()
    await home.itemsTable.expectRowHidden(f.item, { timeout: 15_000 })
  })
})
