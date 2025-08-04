import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client on the server
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// The 'context' object (which contains 'Astro') is passed as the second argument
export const POST = async ({ request, redirect, url }) => {
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
        // MODIFIED: Use the site's origin for a reliable production URL
        emailRedirectTo: new URL("/referral", url.origin).href,
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
};
