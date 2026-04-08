import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Heart, Bookmark, MessageCircle, Star, ArrowUpDown } from "lucide-react";
import { useXhsSearch, type XhsNote } from "@/hooks/useXhsSearch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortField = "likes" | "collects" | "comments" | "total";

export function XhsSearchPanel() {
  const { loading, results, search, saveNote } = useXhsSearch();
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("total");

  const handleSearch = () => {
    if (keyword.trim()) search(keyword);
  };

  const getTotal = (n: XhsNote) => (n.likes ?? 0) + (n.collects ?? 0) + (n.comments ?? 0);

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "likes": return (b.likes ?? 0) - (a.likes ?? 0);
      case "collects": return (b.collects ?? 0) - (a.collects ?? 0);
      case "comments": return (b.comments ?? 0) - (a.comments ?? 0);
      case "total": return getTotal(b) - getTotal(a);
      default: return 0;
    }
  });

  const suggestedKeywords = ["情绪管理", "心理成长", "自我提升", "冥想", "焦虑", "内耗", "自信", "能量"];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder="输入关键词搜索小红书笔记..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading || !keyword.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
          搜索
        </Button>
      </div>

      {/* Suggested keywords */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground py-1">热门：</span>
        {suggestedKeywords.map((kw) => (
          <Badge
            key={kw}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => { setKeyword(kw); search(kw); }}
          >
            {kw}
          </Badge>
        ))}
      </div>

      {/* Sort & count */}
      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {results.length} 条结果
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">总互动量</SelectItem>
                <SelectItem value="likes">点赞数</SelectItem>
                <SelectItem value="collects">收藏数</SelectItem>
                <SelectItem value="comments">评论数</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="grid gap-3">
        {sortedResults.map((note, idx) => (
          <Card key={note.note_id || idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {note.title || "无标题"}
                  </h3>
                  {note.author && (
                    <p className="text-xs text-muted-foreground mb-2">@{note.author}</p>
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
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      总 {getTotal(note).toLocaleString()}
                    </span>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs py-0">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => saveNote(note)}
                  title="收藏"
                >
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!loading && results.length === 0 && keyword && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>未找到相关笔记</p>
          <p className="text-xs mt-1">请确认 MCP Server 已部署并正常运行</p>
        </div>
      )}
    </div>
  );
}
