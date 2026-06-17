import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "node:crypto";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

const MIN_FORM_AGE_MS = 2500;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

const getFormSpamSecret = () =>
  import.meta.env.FORM_SPAM_SECRET ||
  import.meta.env.SUPABASE_SERVICE_KEY ||
  "dev-form-spam-secret";

const signFormIssuedAt = (issuedAt: string) =>
  createHmac("sha256", getFormSpamSecret()).update(issuedAt).digest("hex");

const hexToBytes = (hex: string) => {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }

  return bytes;
};

const signaturesMatch = (expected: string, received: string) => {
  const expectedBytes = hexToBytes(expected);
  const receivedBytes = hexToBytes(received);

  if (!expectedBytes || !receivedBytes || expectedBytes.length !== receivedBytes.length) {
    return false;
  }

  return timingSafeEqual(expectedBytes, receivedBytes);
};

const verifyFormSubmission = (formData: FormData) => {
  const issuedAt = formData.get("_formIssuedAt");
  const signature = formData.get("_formSignature");
  const interaction = formData.get("_formInteraction");

  if (typeof issuedAt !== "string" || typeof signature !== "string") {
    return false;
  }

  if (interaction !== "started") {
    return false;
  }

  const issuedAtTime = Number(issuedAt);
  if (!Number.isFinite(issuedAtTime)) {
    return false;
  }

  const formAge = Date.now() - issuedAtTime;
  if (formAge < MIN_FORM_AGE_MS || formAge > MAX_FORM_AGE_MS) {
    return false;
  }

  return signaturesMatch(signFormIssuedAt(issuedAt), signature);
};

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const leadData = Object.fromEntries(formData);

  if (!verifyFormSubmission(formData)) {
    return new Response(JSON.stringify({ error: "Please refresh the page and try again." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
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
    const resendApiKey = import.meta.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(resendApiKey);
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
          leadData.referral
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
      from: "Veterans Disability Network <advisor-gbogan@veteransdisabilitynetwork.org>",
      to: ["VTeam9484@gmail.com"],
      subject: `New Consultation Request from ${leadData.firstName} ${leadData.lastName}`,
      html: emailHtmlBody,
    });

    console.log("Consultation email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't block the user flow if the email fails, but we log the error.
  }

  // --- Step 3: Redirect the user to a "Thank You" page ---
  return redirect("/thankyou", 303);
};
