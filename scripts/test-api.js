import { createClient } from "@supabase/supabase-js";

const url = "https://llvszoblxpblvwzmlkeq.supabase.co";
const key = "sb_publishable_QIPUB5wfg5zerYs1eu0tkA_0vPth1me";

const supabase = createClient(url, key);

async function test() {
  console.log("Testing Supabase connection to properties...");
  const { data, error } = await supabase.from("properties").select("*");
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
