import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client on the server
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function POST({ request }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // This is the URL the user will be redirected to after clicking the magic link.
        // We'll create this page in the next step.
        emailRedirectTo: new URL("/referral", request.url).href,
      },
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Check your email for the magic link!" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
