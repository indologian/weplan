require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function upgradeToPremium() {
  const { error } = await supabase
    .from("invitations")
    .update({ entitlement_tier_id: 'f9381244-ebb2-42ae-aa75-018cf99ec0a2' }) // Premium tier
    .eq("id", "30538da2-0b90-4422-8017-1bba18ef7a4b");
  console.log("Upgraded:", error);
}
upgradeToPremium();
