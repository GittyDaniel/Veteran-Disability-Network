// src/pages/api/comments.ts
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

// --- GET Endpoint: Fetches and nests comments ---
export const GET: APIRoute = async ({ url }) => {
  const postSlug = url.searchParams.get("post_slug");
  const viewerId = url.searchParams.get("viewer_id"); // optional

  if (!postSlug) {
    return new Response(JSON.stringify({ error: "post_slug is required" }), {
      status: 400,
    });
  }

  // 1) comments
  const { data: comments, error: commentsErr } = await supabase
    .from("comments")
    .select("id, created_at, author_name, content, parent_id")
    .eq("post_slug", postSlug)
    .order("created_at", { ascending: true });

  if (commentsErr) {
    console.error(commentsErr);
    return new Response(JSON.stringify({ error: "Failed to fetch comments" }), {
      status: 500,
    });
  }

  // 2) like counts
  const { data: likeCounts, error: likesErr } = await supabase
    .from("comment_like_counts")
    .select("comment_id, like_count")
    .in(
      "comment_id",
      comments.map((c) => c.id)
    );

  if (likesErr) {
    console.error(likesErr);
    return new Response(JSON.stringify({ error: "Failed to fetch likes" }), {
      status: 500,
    });
  }
  const likeMap = new Map(
    likeCounts?.map((r) => [r.comment_id, r.like_count]) ?? []
  );

  // 3) did current viewer like? (optional)
  let likedSet = new Set<number>();
  if (viewerId) {
    const { data: likedRows } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("viewer_id", viewerId)
      .in(
        "comment_id",
        comments.map((c) => c.id)
      );
    likedSet = new Set(likedRows?.map((r) => r.comment_id) ?? []);
  }

  // Nesting with like fields
  type C = (typeof comments)[number] & {
    replies: any[];
    like_count: number;
    liked_by_viewer: boolean;
  };
  const byId = new Map<number, C>(
    comments.map((c) => [
      c.id,
      {
        ...c,
        replies: [],
        like_count: likeMap.get(c.id) ?? 0,
        liked_by_viewer: likedSet.has(c.id),
      },
    ])
  );

  const nested: C[] = [];
  for (const c of byId.values()) {
    if (c.parent_id) {
      const p = byId.get(c.parent_id);
      if (p) p.replies.push(c);
    } else nested.push(c);
  }

  return new Response(JSON.stringify(nested.reverse()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// --- POST Endpoint: Saves comments and replies ---
export const POST: APIRoute = async ({ request }) => {
  const {
    post_slug,
    author_name,
    content,
    parent_id = null,
  } = await request.json();

  if (!post_slug || !author_name || !content) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert([{ post_slug, author_name, content, parent_id }])
    .select();

  if (error) {
    console.error("Supabase insert error:", error);
    return new Response(JSON.stringify({ error: "Failed to post comment" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
