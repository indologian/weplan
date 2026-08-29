require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function upgradeBasic() {
  const { error } = await supabase
    .from("tiers")
    .update({ audio_enabled: true, video_limit: 1, audio_size_limit_mb: 5 })
    .eq("code", "basic");
  console.log("Tier updated:", error);
}
upgradeBasic();
