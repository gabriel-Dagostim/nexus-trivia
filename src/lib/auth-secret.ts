import { randomBytes } from 'node:crypto';

const developmentSecret = randomBytes(32);

export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret) {
    if (process.env.NODE_ENV !== 'development' && secret.length < 32) {
      throw new Error('AUTH_SECRET deve ter pelo menos 32 caracteres.');
    }
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === 'development') return developmentSecret;
  throw new Error('AUTH_SECRET é obrigatória fora do desenvolvimento local.');
}
