import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const apiSource = readFileSync(new URL('../api/orders.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace('export default async function handler', 'async function handler');

test('API rejects Sunday pickups before database access; allows Monday through Saturday', async () => {
  for (let day = 15; day <= 21; day++) {
    let saved = 0;
    let connected = 0;
    const context = vm.createContext({
      connectDB: async () => { connected++; },
      Order: { create: async () => { saved++; } },
      process: { env: {} },
      console: { error() {} }
    });
    vm.runInContext(apiSource, context);
    const response = {
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    await context.handler({ method: 'POST', body: {
      name: 'Test', email: 'test@example.com', phone: '3135551234',
      items: 'Rolls (Regular)', dateNeeded: `2026-11-${day}`
    } }, response);
    assert.equal(response.statusCode, day === 15 ? 400 : 201);
    assert.equal(saved, day === 15 ? 0 : 1);
    assert.equal(connected, day === 15 ? 0 : 1);
    if (day === 15) assert.equal(response.body.code, 'SUNDAY_PICKUP');
  }
});

test('API rejects invalid dates without database access', async () => {
  const context = vm.createContext({ connectDB: () => assert.fail('Unexpected database access') });
  vm.runInContext(apiSource, context);
  for (const dateNeeded of [undefined, '', 'invalid', '2026-02-30', '2026-11-15T12:00:00Z']) {
    const response = {
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; }
    };
    await context.handler({ method: 'POST', body: { dateNeeded } }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.orderSaved, false);
  }
});

test('form blocks Sunday submission and clears the error for another date or reset', async () => {
  const elements = {};
  function element(id) {
    return elements[id] ??= {
      listeners: {}, value: '', validityMessage: '',
      addEventListener(event, callback) { this.listeners[event] = callback; },
      setCustomValidity(message) { this.validityMessage = message; },
      reportValidity() { return !elements.dateNeeded.validityMessage; }
    };
  }
  const dateField = element('dateNeeded');
  const context = vm.createContext({
    document: { getElementById: element }, dateField,
    cart: {}, fetch: () => assert.fail('Sunday must not submit')
  });
  vm.runInContext(readFileSync(new URL('../public/preorder-submit.js', import.meta.url), 'utf8'), context);
  dateField.value = '2026-11-15';
  dateField.listeners.change();
  assert.match(dateField.validityMessage, /closed on Sundays/);
  await elements.preorderForm.listeners.submit({ preventDefault() {} });
  assert.match(dateField.validityMessage, /closed on Sundays/);
  dateField.value = '2026-11-16';
  dateField.listeners.input();
  assert.equal(dateField.validityMessage, '');
  dateField.value = '2026-11-22';
  dateField.listeners.change();
  elements.preorderForm.listeners.reset();
  assert.equal(dateField.validityMessage, '');
});
