import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data;
}

export async function addUser(user: { name: string; wallet: string }) {
  const { data, error } = await supabase.from("users").insert([user]);
  if (error) throw error;
  return data;
}
