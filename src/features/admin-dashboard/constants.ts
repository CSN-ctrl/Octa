import type { AdminTabDescriptor } from "./types";

export const TREASURY_WALLET = "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33";
export const TREASURY_DEFAULT_BALANCE = 1_000_000;
export const TREASURY_TX_PAGE_SIZE = 10;

export const ADMIN_TAB_DESCRIPTORS: AdminTabDescriptor[] = [
  { key: "treasury", label: "Treasury", domain: "treasury" },
  { key: "users", label: "Users", domain: "users" },
  { key: "transactions", label: "Transactions", domain: "treasury" },
  { key: "affiliates", label: "Affiliates", domain: "affiliates" },
  { key: "star-systems", label: "Star Systems", domain: "content" },
  { key: "planets", label: "Planets", domain: "content" },
  { key: "cities", label: "Cities", domain: "content" },
  { key: "resources", label: "Resources", domain: "content" },
  { key: "documents", label: "Documents", domain: "content" },
];
