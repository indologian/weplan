require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function manualProcessAudio() {
  const mediaId = "054308d5-7c5c-40c5-b04d-c049c8cb51f4"; // one of the recent ones
  const { data: media } = await supabase.from("media_assets").select("*").eq("id", mediaId).single();
  
  const { data: fileData } = await supabase.storage.from("quarantine").download(media.quarantine_path);
  const arrayBuffer = await fileData.arrayBuffer();
  
  const ext = media.original_filename?.split(".").pop() ?? "mp3";
  const finalPath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}.${ext}`;
  
  let contentType = "audio/mpeg";
  if (ext === "m4a") contentType = "audio/mp4";
  else if (ext === "ogg") contentType = "audio/ogg";
  else if (ext === "wav") contentType = "audio/wav";

  const { error } = await supabase.storage.from("invitation_media").upload(finalPath, arrayBuffer, { contentType, upsert: true });
  console.log("Upload error:", error);
  if (!error) {
    await supabase.from("media_assets").update({ status: "ready", final_path: finalPath, detected_mime: contentType, updated_at: new Date().toISOString() }).eq("id", mediaId);
    console.log("Processed successfully");
  }
}
manualProcessAudio();
