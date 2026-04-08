import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface XhsNote {
  note_id: string;
  title: string;
  content?: string;
  author?: string;
  likes?: number;
  collects?: number;
  comments?: number;
  note_url?: string;
  cover_url?: string;
  tags?: string[];
}

interface SearchResult {
  data: XhsNote[] | any;
  cached: boolean;
  cached_at?: string;
}

export function useXhsSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<XhsNote[]>([]);
  const [serverStatus, setServerStatus] = useState<{
    configured: boolean;
    reachable: boolean;
  } | null>(null);

  const search = async (keyword: string, limit = 20) => {
    if (!keyword.trim()) {
      toast.error("请输入搜索关键词");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: { action: "search", keyword: keyword.trim(), limit },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const searchResult = data as SearchResult;
      const notes = Array.isArray(searchResult.data) ? searchResult.data : [];
      setResults(notes);

      if (searchResult.cached) {
        toast.info("使用缓存结果（24小时内）");
      } else {
        toast.success(`找到 ${notes.length} 条笔记`);
      }
    } catch (err: any) {
      console.error("[useXhsSearch]", err);
      toast.error(err.message || "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("xhs-mcp-proxy", {
        body: { action: "status" },
      });
      if (error) throw error;
      setServerStatus({
        configured: data?.configured ?? false,
        reachable: data?.reachable ?? false,
      });
      return data;
    } catch {
      setServerStatus({ configured: false, reachable: false });
    }
  };

  const saveNote = async (note: XhsNote) => {
    try {
      const { error } = await supabase.from("xhs_saved_notes" as any).upsert(
        {
          note_id: note.note_id,
          title: note.title,
          content: note.content,
          author: note.author,
          likes: note.likes ?? 0,
          collects: note.collects ?? 0,
          comments: note.comments ?? 0,
          note_url: note.note_url,
          cover_url: note.cover_url,
          tags: note.tags ?? [],
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
        { onConflict: "user_id,note_id" }
      );
      if (error) throw error;
      toast.success("已收藏");
    } catch (err: any) {
      toast.error("收藏失败: " + (err.message || "未知错误"));
    }
  };

  const getSavedNotes = async () => {
    const { data, error } = await supabase
      .from("xhs_saved_notes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("加载收藏失败");
      return [];
    }
    return data ?? [];
  };

  const deleteSavedNote = async (id: string) => {
    const { error } = await supabase.from("xhs_saved_notes" as any).delete().eq("id", id);
    if (error) {
      toast.error("删除失败");
      return false;
    }
    toast.success("已取消收藏");
    return true;
  };

  return {
    loading,
    results,
    serverStatus,
    search,
    checkStatus,
    saveNote,
    getSavedNotes,
    deleteSavedNote,
  };
}
