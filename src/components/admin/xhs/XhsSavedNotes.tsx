import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, MessageCircle, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useXhsSearch } from "@/hooks/useXhsSearch";

export function XhsSavedNotes() {
  const { getSavedNotes, deleteSavedNote } = useXhsSearch();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getSavedNotes();
    setNotes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const ok = await deleteSavedNote(id);
    if (ok) setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        加载收藏...
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>暂无收藏笔记</p>
        <p className="text-xs mt-1">在搜索结果中点击 ⭐ 收藏</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">共 {notes.length} 条收藏</p>
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {note.title || "无标题"}
                </h3>
                {note.author && (
                  <p className="text-xs text-muted-foreground mb-2">@{note.author}</p>
                )}
                {note.content && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                    {note.content}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    {(note.likes ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3 text-amber-400" />
                    {(note.collects ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-400" />
                    {(note.comments ?? 0).toLocaleString()}
                  </span>
                </div>
                {note.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 5).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs py-0">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {note.ai_analysis && (
                  <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                    <span className="font-medium">AI 分析：</span>
                    {note.ai_analysis}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {note.note_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={note.note_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(note.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
