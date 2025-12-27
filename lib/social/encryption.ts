/**
 * Token Encryption Utilities
 *
 * Encrypt/decrypt OAuth tokens before storing in database
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * Format: base64-encoded 32-byte key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'SOCIAL_TOKEN_ENCRYPTION_KEY is not set. Generate with: openssl rand -base64 32'
    );
  }

  try {
    const buffer = Buffer.from(key, 'base64');
    if (buffer.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes');
    }
    return buffer;
  } catch (error) {
    throw new Error('Invalid SOCIAL_TOKEN_ENCRYPTION_KEY format. Must be base64-encoded 32 bytes');
  }
}

/**
 * Encrypt a token string
 *
 * @param token - The plain text token to encrypt
 * @returns Encrypted token in format: iv:authTag:encrypted (all base64)
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token to encrypt cannot be empty');
  }

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encrypted
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');
  } catch (error) {
    throw new Error(`Token encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypt an encrypted token
 *
 * @param encryptedToken - Encrypted token in format: iv:authTag:encrypted
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Encrypted token cannot be empty');
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedToken.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivBase64, authTagBase64, encrypted] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid IV or auth tag length');
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Token decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Hash a token for comparison (one-way)
 * Useful for checking if tokens match without decrypting
 *
 * @param token - Token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random state for OAuth
 *
 * @returns Random state string
 */
export function generateOAuthState(): string {
  return randomBytes(SALT_LENGTH).toString('base64url');
}

/**
 * Verify OAuth state matches
 *
 * @param state - State from OAuth callback
 * @param expectedState - Expected state from session/cookie
 * @returns True if states match
 */
export function verifyOAuthState(state: string, expectedState: string): boolean {
  if (!state || !expectedState) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const crypto = require('crypto');
  const stateBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expectedState);

  if (stateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(stateBuffer, expectedBuffer);
}
