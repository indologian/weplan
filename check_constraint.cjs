require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkConstraint() {
  const { data, error } = await supabase.from("invitations").select("*").limit(1);
  console.log(data); // Just to test query
  
  // I can't easily query pg_constraint from PostgREST unless exposed, but I can check migrations!
}
checkConstraint();
