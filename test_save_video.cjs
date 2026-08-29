require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function testSave() {
  const { data: inv } = await supabase.from("invitations").select("*").eq("id", "30538da2-0b90-4422-8017-1bba18ef7a4b").single();
  const settings = {
    ...inv.settings,
    videoEmbeds: [{ id: "c46006c0-7f21-4fa3-b1d6-d08b3e34b071", kind: "video", provider: "youtube", externalId: "HFwRMrksCo0" }]
  };
  
  const { data, error } = await supabase.rpc("save_invitation_content", {
    p_user_id: "cdfdce2d-727e-485f-bbd4-ad970fa4819b",
    p_invitation_id: inv.id,
    p_expected_version: inv.content_version,
    p_couple: inv.couple,
    p_love_story: inv.love_story,
    p_bank_accounts: inv.bank_accounts,
    p_settings: settings
  });
  console.log(data, error);
}
testSave();
