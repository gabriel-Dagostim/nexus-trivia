import test from 'node:test';
import assert from 'node:assert/strict';
import { getJwtSecret } from '../src/lib/auth-secret.ts';

test('JWT exige segredo configurado em produção e usa chave temporária apenas no desenvolvimento', () => {
  const originalSecret = process.env.AUTH_SECRET;
  const originalMode = process.env.NODE_ENV;
  try {
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = 'production';
    assert.throws(() => getJwtSecret(), /AUTH_SECRET/);

    process.env.AUTH_SECRET = 'short';
    assert.throws(() => getJwtSecret(), /32/);

    process.env.AUTH_SECRET = 'a-test-secret-longer-than-thirty-two-characters';
    assert.equal(new TextDecoder().decode(getJwtSecret()), process.env.AUTH_SECRET);

    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = 'development';
    const first = getJwtSecret();
    assert.equal(first.length, 32);
    assert.deepEqual(getJwtSecret(), first);
  } finally {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
    if (originalMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalMode;
  }
});
