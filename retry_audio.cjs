require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function retryAudio() {
  const { data: rejected } = await supabase
    .from("media_assets")
    .select("*")
    .eq("kind", "audio")
    .eq("status", "rejected");
    
  if (!rejected || rejected.length === 0) return console.log("No rejected audio");

  for (const m of rejected) {
    console.log("Retrying:", m.id);
    await supabase.from("media_assets").update({ status: "uploaded", failure_code: null }).eq("id", m.id);
    
    // trigger webhook logic by calling the API or just let cron do it?
    // Weplan uses a cron/lifecycle or direct edge processing!
    // Let's just fetch the processing endpoint if available.
  }
}
retryAudio();
