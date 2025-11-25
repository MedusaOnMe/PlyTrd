import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from the master key and salt using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(plaintext: string, masterKey?: string): {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
} {
  const key = masterKey || process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error('Encryption master key not configured');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key
  const derivedKey = deriveKey(key, salt);

  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(
  encryptedData: string,
  ivHex: string,
  saltHex: string,
  tagHex: string,
  masterKey?: string
): string {
  const key = masterKey || process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error('Encryption master key not configured');
  }

  // Convert hex strings back to buffers
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  // Derive the same encryption key
  const derivedKey = deriveKey(key, salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts sensitive data and returns a combined string
 */
export function encryptToString(plaintext: string, masterKey?: string): string {
  const { encrypted, iv, salt, tag } = encrypt(plaintext, masterKey);
  // Combine all parts with delimiter
  return `${salt}:${iv}:${tag}:${encrypted}`;
}

/**
 * Decrypts a combined encrypted string
 */
export function decryptFromString(combined: string, masterKey?: string): string {
  const [salt, iv, tag, encrypted] = combined.split(':');
  if (!salt || !iv || !tag || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }
  return decrypt(encrypted, iv, salt, tag, masterKey);
}
