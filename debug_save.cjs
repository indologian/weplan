require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function debugSave() {
  const userId = "cdfdce2d-727e-485f-bbd4-ad970fa4819b"; // user id
  const invitationId = "30538da2-0b90-4422-8017-1bba18ef7a4b";
  
  // Get current version
  const { data: inv } = await supabase.from("invitations").select("*").eq("id", invitationId).single();
  console.log("Current version:", inv.content_version);
  
  const { data, error } = await supabase.rpc("save_invitation_content", {
    p_user_id: userId,
    p_invitation_id: invitationId,
    p_expected_version: inv.content_version,
    p_couple: inv.couple,
    p_love_story: inv.love_story,
    p_bank_accounts: inv.bank_accounts,
    p_settings: inv.settings
  });
  
  console.log("Result:", data, "Error:", error);
}
debugSave();
