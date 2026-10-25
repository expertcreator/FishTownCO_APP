import { createPrivateKey, createSign } from "crypto";

const APPLE_AUDIENCE = "https://appleid.apple.com";

export type AppleClientSecretInput = {
  teamId: string;
  keyId: string;
  clientId: string;
  privateKey: string;
};

/**
 * Builds the client secret Apple expects for token exchange and revocation.
 * The secret is an ES256 JWT signed with the Sign in with Apple private key.
 * @param input - Team id, key id, bundle id, and PEM private key
 * @returns Signed client secret
 */
export function createAppleClientSecret(input: AppleClientSecretInput): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(
    JSON.stringify({ alg: "ES256", kid: input.keyId.trim() })
  );
  const payload = base64Url(
    JSON.stringify({
      iss: input.teamId.trim(),
      iat: now,
      exp: now + 5 * 60,
      aud: APPLE_AUDIENCE,
      sub: input.clientId.trim(),
    })
  );
  const unsigned = `${header}.${payload}`;
  const key = createPrivateKey(normalizePrivateKey(input.privateKey));
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const jose = derSignatureToJose(signer.sign(key));
  return `${unsigned}.${base64Url(jose)}`;
}

/**
 * Converts a DER ECDSA signature into the raw 64-byte form Apple's JWT check uses.
 * @param der - DER encoded P-256 signature
 * @returns Concatenated r and s, 32 bytes each
 */
export function derSignatureToJose(der: Buffer): Buffer {
  let offset = 0;
  if (der[offset] !== 0x30) {
    throw new Error("APPLE_SECRET_SIGNATURE");
  }
  offset += 1;
  if ((der[offset] & 0x80) !== 0) {
    offset += 1 + (der[offset] & 0x7f);
  } else {
    offset += 1;
  }

  const readInteger = () => {
    if (der[offset] !== 0x02) {
      throw new Error("APPLE_SECRET_SIGNATURE");
    }
    const length = der[offset + 1];
    const start = offset + 2;
    offset = start + length;
    let value = der.subarray(start, start + length);
    if (value[0] === 0x00) {
      value = value.subarray(1);
    }
    if (value.length > 32) {
      throw new Error("APPLE_SECRET_SIGNATURE");
    }
    const padded = Buffer.alloc(32);
    value.copy(padded, 32 - value.length);
    return padded;
  };

  const r = readInteger();
  const s = readInteger();
  return Buffer.concat([r, s]);
}

/**
 * Turns a Secret Manager private key into a PEM string.
 * @param value - Raw secret value
 * @returns PEM private key
 */
function normalizePrivateKey(value: string): string {
  return value.trim().replace(/\\n/g, "\n");
}

/**
 * Encodes bytes or text as base64url without padding.
 * @param value - Data to encode
 * @returns Base64url string
 */
function base64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}
