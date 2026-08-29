require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
supabase.from('invitations').select('content_version').eq('id', '30538da2-0b90-4422-8017-1bba18ef7a4b').single().then(console.log);
