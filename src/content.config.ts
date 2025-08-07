import { defineCollection, z } from "astro:content";

// Define the schema for the 'blog' collection
const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform the string date from frontmatter into a JavaScript Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    // Add the new fields for the cover image
    coverImage: z.string(),
    coverAlt: z.string(),
  }),
});

// Export a single 'collections' object to register your collection(s)
export const collections = {
  blog,
};
