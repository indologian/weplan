require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function testUpload() {
  const finalPath = "cdfdce2d-727e-485f-bbd4-ad970fa4819b/30538da2-0b90-4422-8017-1bba18ef7a4b/background_music/test.mp3";
  const dummyBuffer = new Uint8Array([0,0,0,0]).buffer;
  
  const { data, error } = await supabase.storage
    .from("invitation_media")
    .upload(finalPath, dummyBuffer, { upsert: true });
    
  console.log("Data:", data);
  console.log("Error:", error);
}
testUpload();
