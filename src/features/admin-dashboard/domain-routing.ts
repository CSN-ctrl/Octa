import type { AdminTab } from "./types";

const CONTENT_TABS = new Set<AdminTab>(["star-systems", "planets", "cities", "resources", "documents"]);
const TREASURY_TABS = new Set<AdminTab>(["treasury", "transactions"]);
const USER_TABS = new Set<AdminTab>(["users"]);
const AFFILIATE_TABS = new Set<AdminTab>(["affiliates"]);

export function isContentTab(tab: AdminTab): boolean {
  return CONTENT_TABS.has(tab);
}

export function isTreasuryTab(tab: AdminTab): boolean {
  return TREASURY_TABS.has(tab);
}

export function isUserTab(tab: AdminTab): boolean {
  return USER_TABS.has(tab);
}

export function isAffiliateTab(tab: AdminTab): boolean {
  return AFFILIATE_TABS.has(tab);
}
