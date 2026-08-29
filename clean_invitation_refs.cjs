require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function cleanInvitationJSON() {
  const invitationId = "30538da2-0b90-4422-8017-1bba18ef7a4b";
  
  // 1. Ambil data invitation saat ini
  const { data: inv, error: fetchError } = await supabase
    .from("invitations")
    .select("couple, love_story")
    .eq("id", invitationId)
    .single();
    
  if (fetchError) {
    console.error("Gagal mengambil invitation:", fetchError);
    return;
  }
  
  console.log("Data lama couple:", JSON.stringify(inv.couple));
  console.log("Data lama love_story:", JSON.stringify(inv.love_story));
  
  // 2. Bersihkan referensi mediaId
  const newCouple = { ...inv.couple };
  if (newCouple.groom) {
    delete newCouple.groom.photoMediaId;
  }
  if (newCouple.bride) {
    delete newCouple.bride.photoMediaId;
  }
  
  const newLoveStory = []; // Kosongkan galeri sepenuhnya
  
  // 3. Update ke database
  const { error: updateError } = await supabase
    .from("invitations")
    .update({
      couple: newCouple,
      love_story: newLoveStory
    })
    .eq("id", invitationId);
    
  if (updateError) {
    console.error("Gagal update invitation:", updateError);
  } else {
    console.log("Berhasil membersihkan referensi media yang rusak di Editor!");
  }
}

cleanInvitationJSON();
