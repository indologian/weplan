require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkLatest() {
  const { data: mediaList } = await supabase
    .from("media_assets")
    .select("*")
    .eq("kind", "image")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log(mediaList.map(m => ({
    id: m.id,
    purpose: m.purpose,
    status: m.status,
    final_path: m.final_path
  })));
}
checkLatest();
