import { useNavigate } from "react-router-dom";
import { ExternalLink, FileText, ChevronRight } from "lucide-react";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LinkItem {
  title: string;
  path: string;
  note: string;
}

const linkItems: LinkItem[] = [
  {
    title: "WealthCampIntro",
    path: "/wealth-camp-intro",
    note: "财富觉醒训练营介绍页",
  },
  {
    title: "WealthCampActivate",
    path: "/wealth-camp-activate",
    note: "财富训练营激活页",
  },
  {
    title: "PayEntry",
    path: "/pay-entry",
    note: "统一支付入口页",
  },
  {
    title: "PartnerIntro",
    path: "/partner-intro",
    note: "合伙人介绍页",
  },
  {
    title: "YoujinPartnerIntro",
    path: "/partner/youjin-intro",
    note: "有劲合伙人介绍页",
  },
  {
    title: "GratitudeJournalIntro",
    path: "/gratitude-journal-intro",
    note: "感恩日记介绍页",
  },
  {
    title: "EmotionButton",
    path: "/emotion-button",
    note: "情绪按钮工具页",
  },
  {
    title: "TeamCoaching",
    path: "/team-coaching",
    note: "团队教练页",
  },
  {
    title: "UnifiedPayDialog",
    path: "/partner/benefits-all",
    note: "包含统一支付弹层的入口页",
  },
  {
    title: "BloomPartnerIntro",
    path: "/bloom-partner-intro",
    note: "Bloom 合伙人介绍页",
  },
];

export default function PageLinksDocument() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground py-10 sm:py-14">
      <ResponsiveContainer size="lg" className="space-y-6">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            页面链接文档
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">10 个页面入口</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              以下为独立整理的页面链接清单，点击任一条目即可打开对应页面。
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {linkItems.map((item, index) => (
            <Card key={item.title} className="border-border/80 bg-card/95">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardDescription>#{String(index + 1).padStart(2, "0")}</CardDescription>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.note}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="shrink-0"
                  >
                    打开
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <code className="text-sm text-muted-foreground">{item.path}</code>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </section>
      </ResponsiveContainer>
    </main>
  );
}
