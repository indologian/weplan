require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function testSave() {
  const userId = "cdfdce2d-727e-485f-bbd4-ad970fa4819b"; // from previous tests
  const invitationId = "30538da2-0b90-4422-8017-1bba18ef7a4b";

  // First get current version
  const { data: inv } = await supabase.from("invitations").select("content_version").eq("id", invitationId).single();
  const version = inv.content_version;

  const payload = {
    p_user_id: userId,
    p_invitation_id: invitationId,
    p_expected_version: version,
    p_couple: null,
    p_love_story: [
      {
        id: "b31c2791-d1f8-46db-885f-e1012de5bc02", // example random UUID
        photoMediaId: "b31c2791-d1f8-46db-885f-e1012de5bc02", // A valid media ID from previous test
        date: "",
        title: "",
        body: ""
      }
    ],
    p_bank_accounts: null,
    p_settings: null
  };

  const { data, error } = await supabase.rpc("save_invitation_content", payload);
  console.log("RPC Result:", data, "Error:", error);
}

testSave();
