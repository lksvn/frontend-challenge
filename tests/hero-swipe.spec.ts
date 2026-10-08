import { test, expect } from '@playwright/test'

test('hero aceita swipe horizontal e preserva gestos verticais', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('.hero')
  const activeDot = hero.locator('button[aria-current="true"]')
  async function swipe(x: number, y: number) {
    await hero.evaluate(
      (element, end) => {
        const touch = (x: number, y: number) =>
          new Touch({ identifier: 1, target: element, clientX: x, clientY: y })
        element.dispatchEvent(
          new TouchEvent('touchstart', { bubbles: true, touches: [touch(200, 100)] }),
        )
        element.dispatchEvent(
          new TouchEvent('touchend', { bubbles: true, changedTouches: [touch(end.x, end.y)] }),
        )
      },
      { x, y },
    )
  }
  await swipe(100, 105)
  await expect(activeDot).toHaveAttribute('aria-label', 'Exibir slide 2')
  await swipe(210, 200)
  await expect(activeDot).toHaveAttribute('aria-label', 'Exibir slide 2')
  await swipe(220, 105)
  await expect(activeDot).toHaveAttribute('aria-label', 'Exibir slide 2')
  await swipe(300, 105)
  await expect(activeDot).toHaveAttribute('aria-label', 'Exibir slide 1')
  await hero.getByRole('button', { name: 'Exibir slide 3' }).click()
  await expect(activeDot).toHaveAttribute('aria-label', 'Exibir slide 3')
})
