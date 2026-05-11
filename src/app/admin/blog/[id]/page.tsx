"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BlogPostForm } from "../_form";

export default function EditBlogPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("id", id).single()
      .then(({ data }) => setPost(data));
  }, [id]);

  if (!post) return <div className="p-8 text-gray-400">Carregando...</div>;
  return <BlogPostForm initial={post} />;
}
