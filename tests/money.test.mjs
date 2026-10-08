import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromWei, toWei } from '../src/lib/money.ts'

test('ETH mantém precisão sem ponto flutuante', () => {
  assert.equal(fromWei(toWei('0.1') + toWei('0.2')), '0.3')
  assert.equal(fromWei(toWei('1.000000000000000001')), '1.000000000000000001')
  assert.throws(() => toWei('1e2'))
  assert.throws(() => toWei('-1'))
})

import { promotionalPrice } from '../src/mocks/fixtures.ts'

test('promoção de 20% mantém valores ETH exatos', () => {
  assert.equal(promotionalPrice('1.19'), '0.952')
  assert.equal(promotionalPrice('0.1'), '0.08')
})
