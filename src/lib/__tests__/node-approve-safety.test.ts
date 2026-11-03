import { describe, expect, it } from "vitest";
import { documentedSiweTestMessage } from "../../../api/_lib/node-siwe";
import {
  addressesEqualCaseInsensitive,
  chainIdMatchesExpected,
  domainMatchesPageHost,
  evaluatePreSignSafety,
  formatCountdown,
  parseSiweAddressFromMessage,
  secondsUntil,
} from "@/lib/node-approve-safety";

const TEST_MESSAGE = documentedSiweTestMessage();
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("node-approve-safety", () => {
  it("parses SIWE address from documented test vector", () => {
    expect(parseSiweAddressFromMessage(TEST_MESSAGE)).toBe(TEST_ADDRESS);
  });

  it("domainMatchesPageHost is case-insensitive", () => {
    expect(domainMatchesPageHost("www.sarakt.com", "WWW.SARAKT.COM")).toBe(true);
    expect(domainMatchesPageHost("localhost:8080", "www.sarakt.com")).toBe(false);
  });

  it("chainIdMatchesExpected for pilot Fuji", () => {
    expect(chainIdMatchesExpected("43113")).toBe(true);
    expect(chainIdMatchesExpected("1")).toBe(false);
  });

  it("evaluatePreSignSafety blocks domain mismatch", () => {
    const result = evaluatePreSignSafety({
      domain: "evil.example",
      pageHost: "www.sarakt.com",
      chainId: "43113",
      message: TEST_MESSAGE,
      messageAddress: TEST_ADDRESS,
      connectedAddress: TEST_ADDRESS,
    });
    expect(result).toEqual({ ok: false, reason: "domain_mismatch" });
  });

  it("evaluatePreSignSafety blocks wrong wallet", () => {
    const result = evaluatePreSignSafety({
      domain: "www.sarakt.com",
      pageHost: "www.sarakt.com",
      chainId: "43113",
      message: TEST_MESSAGE,
      messageAddress: TEST_ADDRESS,
      connectedAddress: "0x0000000000000000000000000000000000000001",
    });
    expect(result).toEqual({ ok: false, reason: "wrong_wallet" });
  });

  it("evaluatePreSignSafety passes when aligned", () => {
    const result = evaluatePreSignSafety({
      domain: "www.sarakt.com",
      pageHost: "www.sarakt.com",
      chainId: "43113",
      message: TEST_MESSAGE,
      messageAddress: TEST_ADDRESS,
      connectedAddress: TEST_ADDRESS,
    });
    expect(result).toEqual({ ok: true });
  });

  it("addressesEqualCaseInsensitive compares hex addresses", () => {
    expect(
      addressesEqualCaseInsensitive(
        "0xAbCd000000000000000000000000000000000001",
        "0xabcd000000000000000000000000000000000001",
      ),
    ).toBe(true);
  });

  it("formatCountdown and secondsUntil", () => {
    const future = new Date(Date.now() + 125_000).toISOString();
    expect(secondsUntil(future)).toBeGreaterThanOrEqual(124);
    expect(formatCountdown(125)).toBe("2:05");
  });
});
