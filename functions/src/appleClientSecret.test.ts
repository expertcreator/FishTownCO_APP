import { generateKeyPairSync } from "crypto";
import { describe, expect, test } from "bun:test";
import {
  createAppleClientSecret,
  derSignatureToJose,
} from "./appleClientSecret";
import { createSign } from "crypto";

describe("Apple client secret", () => {
  test("signs an ES256 JWT with a 64-byte signature", () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const secret = createAppleClientSecret({
      teamId: "TEAMID123",
      keyId: "KEYID12345",
      clientId: "com.itoasis.Fishtownco",
      privateKey: pem.replace(/\n/g, "\\n"),
    });
    const parts = secret.split(".");
    expect(parts).toHaveLength(3);
    expect(Buffer.from(parts[2], "base64url")).toHaveLength(64);

    const signer = createSign("SHA256");
    signer.update("test");
    signer.end();
    expect(derSignatureToJose(signer.sign(privateKey))).toHaveLength(64);
  });
});
