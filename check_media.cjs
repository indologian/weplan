require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkMedia() {
  const { data: inv } = await supabase.from("invitations").select("settings").eq("id", "30538da2-0b90-4422-8017-1bba18ef7a4b").single();
  const { data: media } = await supabase.from("media_assets").select("*").eq("invitation_id", "30538da2-0b90-4422-8017-1bba18ef7a4b");
  console.log("Settings Audio ID:", inv.settings.backgroundAudioMediaId);
  console.log("Media Assets matching:", media.filter(m => m.id === inv.settings.backgroundAudioMediaId));
}
checkMedia();
