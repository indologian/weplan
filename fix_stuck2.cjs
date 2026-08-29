require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixStuck() {
  const { data: stuck } = await supabase
    .from("media_assets")
    .select("*")
    .eq("kind", "image")
    .eq("status", "processing");
  
  if (!stuck || stuck.length === 0) return console.log("None stuck");

  for (const m of stuck) {
    const e = m.original_filename?.split('.').pop() || 'png';
    const extMatch = e === 'jpg' ? 'jpg' : (e === 'png' ? 'png' : 'jpg');
    
    const finalPath = `${m.owner_id}/${m.invitation_id}/${m.purpose}/${m.id}.${extMatch}`;
    
    // Check if it exists in bucket
    const folder = finalPath.split("/").slice(0, -1).join("/");
    const fileSearch = finalPath.split("/").pop();
    const { data: listData } = await supabase.storage.from("invitation_media").list(folder, { search: fileSearch });
    
    if (listData && listData.length > 0) {
      console.log("Fixing:", m.id, "to", finalPath);
      await supabase.from("media_assets").update({
        status: "ready",
        final_path: finalPath,
        updated_at: new Date().toISOString()
      }).eq("id", m.id);
    } else {
      console.log("Not uploaded:", m.id);
      await supabase.from("media_assets").update({ status: "rejected" }).eq("id", m.id);
    }
  }
}
fixStuck();
