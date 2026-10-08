import { cpus, release } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:4188'
const categories = ['performance', 'accessibility', 'best-practices', 'seo']
await mkdir('reports/lighthouse', { recursive: true })
const results = []
const port = Number(process.env.AUDIT_CHROME_PORT ?? 9227)
const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] })

try {
  for (const profile of ['mobile', 'desktop']) {
    for (const [name, path] of [
      ['home', '/'],
      ['detail', '/nfts/1'],
    ]) {
      const runs = []
      for (let index = 1; index <= 3; index++) {
        const output = `reports/lighthouse/${profile}-${name}-${index}`
        console.log(`Lighthouse: ${profile} ${name} ${index}/3`)
        const result = await lighthouse(
          `${base}${path}`,
          { port, onlyCategories: categories, output: ['json', 'html'], logLevel: 'error' },
          profile === 'desktop' ? desktopConfig : undefined,
        )
        if (!result || result.lhr.runtimeError)
          throw new Error(result?.lhr.runtimeError?.message ?? 'Auditoria falhou')
        const report = result.lhr
        await writeFile(`${output}.report.json`, result.report[0])
        await writeFile(`${output}.report.html`, result.report[1])
        runs.push({
          scores: Object.fromEntries(
            categories.map((category) => [category, report.categories[category].score * 100]),
          ),
          LCP: report.audits['largest-contentful-paint'].numericValue,
          CLS: report.audits['cumulative-layout-shift'].numericValue,
          TBT: report.audits['total-blocking-time'].numericValue,
          lighthouseVersion: report.lighthouseVersion,
          environment: report.environment,
        })
      }
      const median = (values) => [...values].sort((a, b) => a - b)[1]
      results.push({
        profile,
        page: name,
        runs,
        median: {
          ...Object.fromEntries(
            categories.map((category) => [
              category,
              median(runs.map((run) => run.scores[category])),
            ]),
          ),
          ...Object.fromEntries(
            ['LCP', 'CLS', 'TBT'].map((metric) => [metric, median(runs.map((run) => run[metric]))]),
          ),
        },
      })
      await writeFile(
        'reports/lighthouse/summary.json',
        JSON.stringify(
          {
            date: new Date().toISOString(),
            platform: process.platform,
            node: process.version,
            osRelease: release(),
            cpu: cpus()[0]?.model,
            browser: browser.version(),
            targets: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 },
            conditions:
              'Build de produção, mocks no cenário padrão, armazenamento limpo pelo Lighthouse, throttling padrão de cada perfil, três execuções sequenciais por caso.',
            base,
            results,
          },
          null,
          2,
        ),
      )
    }
  }
} finally {
  await browser.close()
}
