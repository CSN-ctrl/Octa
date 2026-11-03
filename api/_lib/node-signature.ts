import { verifyMessage } from "ethers";
import { normalizeWalletAddress } from "./node-constants";

export function recoverWalletFromJoinSignature(message: string, signature: string): string | null {
  try {
    const recovered = verifyMessage(message, signature);
    return normalizeWalletAddress(recovered);
  } catch {
    return null;
  }
}
