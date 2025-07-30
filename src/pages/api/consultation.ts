import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

// Initialize Resend client with your API key
const resend = new Resend(import.meta.env.RESEND_API_KEY);

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
      .select("id")
      .eq("referral_code", referralCode.trim().toUpperCase())
      .single();

    if (error) {
      console.error("Error validating referral code:", error.message);
    } else if (profile) {
      referredBy = profile.id;
      console.log(
        `Valid referral code used. Referred by user ID: ${referredBy}`
      );
    } else {
      console.log(
        `Invalid or non-existent referral code provided: ${referralCode}`
      );
    }
  }

  // --- Step 2: Send the email notification ---
  try {
    const emailHtmlBody = `
      <h1>New Consultation Request</h1>
      <p>A new potential client has submitted a request for a consultation.</p>
      <hr>
      <h2>Contact Details</h2>
      <ul>
        <li><strong>Name:</strong> ${leadData.firstName} ${
      leadData.lastName
    }</li>
        <li><strong>Email:</strong> ${leadData.email}</li>
        <li><strong>Phone:</strong> ${leadData.phone}</li>
        <li><strong>Location:</strong> ${leadData.state}, ${leadData.zip}</li>
      </ul>
      <h2>Referral Information</h2>
      <ul>
        <li><strong>How they heard about us:</strong> ${
          leadData.referralSource
        }</li>
        <li><strong>Referral Code Provided:</strong> ${
          leadData.referralCode || "N/A"
        }</li>
        <li><strong>Referring User ID (if valid code):</strong> ${
          referredBy || "N/A"
        }</li>
      </ul>
      <h2>Message</h2>
      <p>${leadData.message || "No message provided."}</p>
      <hr>
      <p><em>This email was sent automatically from the website contact form.</em></p>
    `;

    await resend.emails.send({
      from: "onboarding@resend.dev", // IMPORTANT: Replace with your verified domain, e.g., 'noreply@veteransdisabilitynetwork.org'
      to: "advisor-1@veteransdisabilitynetwork.org",
      subject: `New Consultation Request from ${leadData.firstName} ${leadData.lastName}`,
      html: emailHtmlBody,
    });

    console.log("Consultation email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't block the user flow if the email fails, but we log the error.
  }

  // --- Step 3: Redirect the user to a "Thank You" page ---
  return redirect("/thank-you", 303);
};
