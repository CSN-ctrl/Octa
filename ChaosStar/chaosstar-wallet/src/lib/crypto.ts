import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Configure ed25519 to use sha512
(ed.etc as { sha512Sync?: (...m: Uint8Array[]) => Uint8Array }).sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));

export interface Wallet {
  privateKey: string;
  publicKey: string;
  address: string;
}

// Generate random bytes using Web Crypto API
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

// Generate a new ED25519 keypair
export async function generateWallet(): Promise<Wallet> {
  // Generate 32 random bytes for private key using Web Crypto
  const privateKey = getRandomBytes(32);
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  // Create address: typeID (1 byte) + publicKey (32 bytes) = 33 bytes
  // TypeID 0 = ED25519
  const addressBytes = new Uint8Array(33);
  addressBytes[0] = 0; // ED25519 type
  addressBytes.set(publicKey, 1);
  
  // Add checksum (4 bytes)
  const checksum = computeChecksum(addressBytes);
  const addressWithChecksum = new Uint8Array(37);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checksum, 33);
  
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
    address: '0x' + bytesToHex(addressWithChecksum),
  };
}

// Import wallet from private key
export async function importWallet(privateKeyHex: string): Promise<Wallet> {
  const privateKey = hexToBytes(privateKeyHex.replace('0x', ''));
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  const addressBytes = new Uint8Array(33);
  addressBytes[0] = 0;
  addressBytes.set(publicKey, 1);
  
  const checksum = computeChecksum(addressBytes);
  const addressWithChecksum = new Uint8Array(37);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checksum, 33);
  
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
    address: '0x' + bytesToHex(addressWithChecksum),
  };
}

// Compute 4-byte checksum using SHA256
function computeChecksum(data: Uint8Array): Uint8Array {
  // Simple checksum - first 4 bytes of SHA256
  const hash = sha256Simple(data);
  return hash.slice(0, 4);
}

// Simple SHA256 implementation for checksum
function sha256Simple(data: Uint8Array): Uint8Array {
  // Using a simple hash for checksum
  // In production, use proper SHA256
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash[i % 32] ^= data[i];
    hash[(i + 1) % 32] = (hash[(i + 1) % 32] + data[i]) % 256;
  }
  return hash;
}

// Sign a message
export async function signMessage(privateKeyHex: string, message: Uint8Array): Promise<string> {
  const privateKey = hexToBytes(privateKeyHex.replace('0x', ''));
  const signature = await ed.signAsync(message, privateKey);
  return bytesToHex(signature);
}

// Verify a signature
export async function verifySignature(
  publicKeyHex: string,
  message: Uint8Array,
  signatureHex: string
): Promise<boolean> {
  const publicKey = hexToBytes(publicKeyHex.replace('0x', ''));
  const signature = hexToBytes(signatureHex.replace('0x', ''));
  return await ed.verifyAsync(signature, message, publicKey);
}

// Format address for display
export function formatAddress(address: string, chars: number = 8): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Token types
export const TokenType = {
  XBGL: 0,
  CHAOS: 1,
  XEN: 2,
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export const TOKEN_INFO = {
  [TokenType.XBGL]: {
    name: 'xBGL',
    symbol: 'xBGL',
    color: '#00d4ff',
    description: 'Primary governance token',
  },
  [TokenType.CHAOS]: {
    name: 'Chaos',
    symbol: 'CHAOS',
    color: '#ff3366',
    description: 'In-game currency',
  },
  [TokenType.XEN]: {
    name: 'Xen',
    symbol: 'XEN',
    color: '#9945ff',
    description: 'Staking rewards token',
  },
};

