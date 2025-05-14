import { fetchBlogPosts } from "@/contentful/blogPosts";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const posts = await fetchBlogPosts({ preview: false });

    posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const recentPosts = posts.slice(0, 3);

    return NextResponse.json(recentPosts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 },
    );
  }
}
