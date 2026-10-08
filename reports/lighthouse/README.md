# Auditoria do build local

Executada em 08/10/2026, com o build de produção e os mocks no cenário padrão. Foram feitas três medições sequenciais por página e perfil, sem testes concorrentes. Os perfis e o throttling são os padrões do Lighthouse.

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | Início | 94 | 96 | 100 | 100 | 2753 | 0.0003 | 68 |
| mobile | Detalhe | 92 | 95 | 100 | 100 | 3162 | 0.0002 | 71 |
| desktop | Início | 97 | 97 | 100 | 100 | 1187 | 0.0017 | 0 |
| desktop | Detalhe | 92 | 97 | 100 | 100 | 1142 | 0.1394 | 0 |

As quatro combinações atingiram as metas: Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90. Não foram removidas imagens, fontes ou funcionalidades para a medição.

O LCP mobile ainda passa de 2,5s. No detalhe desktop, o CLS ficou em 0,1394: o Lighthouse atribuiu quase todo esse deslocamento ao rodapé enquanto o conteúdo do detalhe era carregado. Esses pontos ficam registrados como limitações; não impedem as notas mínimas pedidas.

Esta medição usa o preview local, não a versão publicada no GitHub Pages. O resultado online pode variar com a rede e o aparelho.

As versões do Lighthouse, Node e Chromium, o sistema, a CPU e as condições completas estão em [summary.json](summary.json). Cada execução possui relatório HTML e JSON nesta pasta. A configuração está em [scripts/audit.mjs](../../scripts/audit.mjs).

Para repetir: execute `pnpm build`, mantenha `pnpm preview --port 4188 --strictPort` ativo e rode `pnpm audit:lighthouse` em outro terminal.
