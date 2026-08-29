require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkVideo() {
  const invitationId = "30538da2-0b90-4422-8017-1bba18ef7a4b";
  const { data: inv } = await supabase.from("invitations").select("settings").eq("id", invitationId).single();
  console.log(JSON.stringify(inv.settings.videoEmbeds, null, 2));
}
checkVideo();
