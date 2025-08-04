import {
  createClient,
  SupabaseClient,
  type Session,
} from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// --- DOM Element selections ---
const registrationView = document.getElementById(
  "registration-view"
) as HTMLDivElement;
const referralCodeView = document.getElementById(
  "referral-code-view"
) as HTMLDivElement;
const magicLinkForm = document.getElementById(
  "magic-link-form"
) as HTMLFormElement;
const submitButton = magicLinkForm.querySelector(
  ".submit-btn"
) as HTMLButtonElement; // Get the button
const formMessage = document.getElementById("form-message") as HTMLDivElement;
const userEmailSpan = document.getElementById("user-email") as HTMLSpanElement;
const referralCodeDiv = document.getElementById(
  "referral-code"
) as HTMLDivElement;
const copyFeedback = document.getElementById(
  "copy-feedback"
) as HTMLParagraphElement;
const signOutBtn = document.getElementById("sign-out-btn") as HTMLButtonElement;

function showMessage(
  message: string,
  type: "success" | "error" = "success"
): void {
  formMessage.textContent = message;
  formMessage.className = `form-message form-message--${type}`;
  formMessage.style.display = "block";
}

magicLinkForm.addEventListener(
  "submit",
  async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const email = (event.target as HTMLFormElement).email.value;

    // --- MODIFIED: Add loading state ---
    submitButton.classList.add("loading");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "An unknown error occurred.");

      showMessage("Success! Check your email for your login link.");
      magicLinkForm.reset();
    } catch (error) {
      console.error("Magic Link Error:", error);
      if (error instanceof Error) {
        showMessage(error.message, "error");
      }
    } finally {
      // --- MODIFIED: Remove loading state ---
      submitButton.classList.remove("loading");
      submitButton.disabled = false;
    }
  }
);

async function getReferralCode(userId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data.referral_code;
}

async function updateUI(session: Session | null): Promise<void> {
  if (session) {
    registrationView.hidden = true;
    referralCodeView.hidden = false;
    const user = session.user;
    userEmailSpan.textContent = user.email || "No email found";
    const code = await getReferralCode(user.id);
    referralCodeDiv.textContent = code || "Loading...";
  } else {
    registrationView.hidden = false;
    referralCodeView.hidden = true;
  }
}

signOutBtn.addEventListener("click", async (): Promise<void> => {
  await supabaseClient.auth.signOut();
});

referralCodeDiv.addEventListener("click", (): void => {
  if (referralCodeDiv.textContent) {
    navigator.clipboard.writeText(referralCodeDiv.textContent).then(() => {
      copyFeedback.textContent = "Copied to clipboard!";
      setTimeout(() => {
        copyFeedback.textContent = "";
      }, 2000);
    });
  }
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateUI(session);
});

document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  updateUI(session);
});
