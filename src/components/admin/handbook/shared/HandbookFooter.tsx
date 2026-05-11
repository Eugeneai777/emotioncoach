import { createContext, useContext, type ReactNode } from "react";

type HandbookVariant = "male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening";

const HandbookVariantContext = createContext<HandbookVariant | undefined>(undefined);

export function HandbookVariantProvider({
  variant,
  children,
}: {
  variant: HandbookVariant;
  children: ReactNode;
}) {
  return (
    <HandbookVariantContext.Provider value={variant}>{children}</HandbookVariantContext.Provider>
  );
}

interface Props {
  pageNumber: number;
  totalPages: number;
  recordIdTail: string;
}

export function HandbookFooter({ pageNumber, totalPages, recordIdTail }: Props) {
  const variant = useContext(HandbookVariantContext);
  const leftText =
    variant === "emotion_health" ? "7 天伴随手册 · 给此刻的你" : "7 天伴随手册 · 个人专属";

  return (
    <div
      style={{
        position: "absolute",
        bottom: "24px",
        left: "56px",
        right: "56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
        borderTop: "1px solid hsl(var(--border))",
        paddingTop: "10px",
      }}
    >
      <span>{leftText}</span>
      <span>档案编号 · {recordIdTail.toUpperCase()}</span>
      <span>
        {pageNumber} / {totalPages}
      </span>
    </div>
  );
}
