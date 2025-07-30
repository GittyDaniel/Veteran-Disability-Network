import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY // Use the service role key for admin-level access
);

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const leadData = Object.fromEntries(formData);

  // Basic spam check (honeypot)
  if (leadData.company) {
    return new Response("Spam detected", { status: 400 });
  }

  let referredBy: string | null = null;
  const referralCode = leadData.referralCode as string;

  // --- Step 1: Validate the Referral Code if it exists ---
  if (referralCode && referralCode.trim() !== "") {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id") // We just need to know if it exists
      .eq("referral_code", referralCode.trim().toUpperCase())
      .single();

    if (error) {
      console.error("Error validating referral code:", error.message);
      // Don't block submission if there's a DB error, just log it.
    }

    if (profile) {
      // The code is valid!
      referredBy = profile.id; // Store the ID of the user who made the referral
      console.log(
        `Valid referral code used. Referred by user ID: ${referredBy}`
      );
    } else {
      console.log(
        `Invalid or non-existent referral code provided: ${referralCode}`
      );
    }
  }

  // --- Step 2: Construct the lead summary ---
  // Here, you would typically send an email or save the lead to a CRM.
  // For now, we will log it to the server console.

  const leadSummary = {
    ...leadData,
    submissionDate: new Date().toISOString(),
    referredByUserId: referredBy, // Will be null if no valid code was used
  };

  console.log("--- New Consultation Lead ---");
  console.log(JSON.stringify(leadSummary, null, 2));
  console.log("-----------------------------");

  // --- Step 3: Redirect the user to a "Thank You" page ---
  // This is a better user experience than just showing a JSON message.
  // You should create a page at /thank-you in your `src/pages` directory.
  return redirect("/thank-you", 303);
};
