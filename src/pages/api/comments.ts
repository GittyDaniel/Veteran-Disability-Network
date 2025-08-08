// src/pages/api/comments.ts
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

console.log("Server-side SUPABASE_URL:", import.meta.env.PUBLIC_SUPABASE_URL);
console.log(
  "Server-side SUPABASE_SERVICE_KEY:",
  !!import.meta.env.SUPABASE_SERVICE_KEY ? "Loaded" : "NOT LOADED"
);

// Initialize Supabase client on the server
// It's best practice to use environment variables for these
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

export const GET: APIRoute = async ({ url }) => {
  const postSlug = url.searchParams.get("post_slug");

  if (!postSlug) {
    return new Response(JSON.stringify({ error: "post_slug is required" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, created_at, author_name, content")
    .eq("post_slug", postSlug)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch comments" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const { post_slug, author_name, content } = await request.json();

  if (!post_slug || !author_name || !content) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert([{ post_slug, author_name, content }])
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to post comment" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
