/**
 * SkillWeave AI - Client-Side Cryptography Service (E2EE)
 * Implements genuine client-side AES-GCM (256-bit) encryption using the standard Web Crypto API.
 * Private notes and personal study journals are encrypted on the user's device
 * BEFORE being sent to the backend or Supabase storage.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM 256-bit CryptoKey using PBKDF2
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data client-side before transmission.
 * @param {string|object} content Data to encrypt
 * @param {string} userSecret User's local private passphrase or derived device secret
 * @returns {Promise<object>} Encrypted payload with iv and salt
 */
export async function encryptClientData(content, userSecret) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(
    typeof content === 'object' ? JSON.stringify(content) : String(content)
  );

  // 16-byte random salt for PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  // 12-byte standard IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(userSecret, salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    plaintextBytes
  );

  return {
    e2ee: true,
    version: 1,
    algorithm: "AES-GCM-256",
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer)
  };
}

/**
 * Decrypts data client-side.
 * @param {object} payload Encrypted payload containing iv, salt, ciphertext
 * @param {string} userSecret User's local private passphrase
 * @returns {Promise<string|object>} Original decrypted content
 */
export async function decryptClientData(payload, userSecret) {
  if (!payload || !payload.e2ee) {
    return payload; // Not E2EE encrypted
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(userSecret, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const decryptedStr = dec.decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedStr);
    } catch {
      return decryptedStr;
    }
  } catch (error) {
    throw new Error("E2EE Decryption failed: Invalid passphrase or corrupted ciphertext.");
  }
}

// Aliases
export const encryptData = encryptClientData;
export const decryptData = decryptClientData;
export const isEncryptedPayload = (payload) => !!(payload && (payload.e2ee || payload.algorithm));

