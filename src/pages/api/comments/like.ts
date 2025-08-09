// src/pages/api/comments/like.ts
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// POST { comment_id: number, viewer_id: string, action?: "like"|"unlike"|"toggle" }
export const POST: APIRoute = async ({ request }) => {
  const { comment_id, viewer_id } = await request.json();

  if (!comment_id || !viewer_id) {
    return new Response(
      JSON.stringify({ error: "comment_id and viewer_id are required" }),
      { status: 400 }
    );
  }

  try {
    // 1) Try to unlike (delete existing like)
    const { data: delRows, error: delErr } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", comment_id)
      .eq("viewer_id", viewer_id)
      .select("id"); // return rows so we can see if something was deleted

    if (delErr) throw delErr;

    let liked_by_viewer: boolean;

    if (delRows && delRows.length > 0) {
      // It was liked -> now unliked
      liked_by_viewer = false;
    } else {
      // 2) Nothing to delete -> insert a like
      const { error: insErr } = await supabase
        .from("comment_likes")
        .insert([{ comment_id, viewer_id }]);
      if (insErr) throw insErr;
      liked_by_viewer = true;
    }

    // 3) Fresh count
    const { count, error: cntErr } = await supabase
      .from("comment_likes")
      .select("id", { count: "exact", head: true })
      .eq("comment_id", comment_id);

    if (cntErr) throw cntErr;

    return new Response(
      JSON.stringify({
        comment_id,
        like_count: count ?? 0,
        liked_by_viewer,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to update like" }), {
      status: 500,
    });
  }
};
