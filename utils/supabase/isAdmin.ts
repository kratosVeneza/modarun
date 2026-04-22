import { createClient } from "@/utils/supabase/server";

export async function getAdminStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data } = await supabase
    .from("admins").select("email")
    .eq("email", user.email?.toLowerCase() ?? "").single();
  return { user, isAdmin: !!data };
}
