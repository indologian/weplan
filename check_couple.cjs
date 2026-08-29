require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function restoreCoupleAndCheck() {
  const groomId = "764797ca-c78a-4f71-9944-06a1f628634a";
  const brideId = "a4de6b09-34d1-4105-8658-5e4a9b0d43e9";

  const { data: m1 } = await supabase.from("media_assets").select("*").eq("id", groomId).maybeSingle();
  const { data: m2 } = await supabase.from("media_assets").select("*").eq("id", brideId).maybeSingle();
  
  console.log("Groom:", m1?.status, m1?.final_path);
  console.log("Bride:", m2?.status, m2?.final_path);

  // Restore the data I accidentally wiped
  const invitationId = "30538da2-0b90-4422-8017-1bba18ef7a4b";
  const { data: inv } = await supabase.from("invitations").select("couple").eq("id", invitationId).single();
  const couple = inv.couple;
  couple.groom.photoMediaId = groomId;
  couple.bride.photoMediaId = brideId;
  
  await supabase.from("invitations").update({
    couple,
    love_story: [{"id":"bce27e0f-3b9c-44ff-a60e-7c2fe55476a7","body":"","date":"","title":"","photoMediaId":"c87459f4-0078-46cb-9867-56a9a224a38d"},{"id":"0647ca19-aaf0-4671-bfcc-99c937dab90f","body":"","date":"","title":"","photoMediaId":"cdba80f3-b078-4c14-b62b-07323e116e41"},{"id":"4386f8cd-7620-4ad5-97cf-d8bc3dbba226","body":"","date":"","title":"","photoMediaId":"e07a5aac-acc5-4ab8-8fb3-7c6b615dbfac"},{"id":"5bfee201-a807-4607-9843-2d852b139392","body":"","date":"","title":"","photoMediaId":"95a7bbe8-6221-457f-9804-d1df4294f077"}]
  }).eq("id", invitationId);
}
restoreCoupleAndCheck();
