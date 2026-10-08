import type { Page } from '@playwright/test'

async function openDemo(page: Page) {
  const panel = page.locator('.demo-panel details')
  if ((await panel.getAttribute('open')) === null) await panel.locator('summary').click()
  return panel
}

export async function clickDemo(page: Page, name: string) {
  const panel = await openDemo(page)
  await panel.getByRole('button', { name, exact: true }).click()
}

export async function selectScenario(page: Page, scenario: string) {
  const panel = await openDemo(page)
  await panel.getByLabel('Cenário de demonstração').selectOption(scenario)
}
