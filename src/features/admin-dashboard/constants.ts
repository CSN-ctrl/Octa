import type { AdminTabDescriptor } from "./types";
import { PROJECT_WALLET } from "@/config/project-wallet";

export const TREASURY_WALLET = PROJECT_WALLET;
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
