interface Props {
  pageNumber: number;
  totalPages: number;
  recordIdTail: string;
}

export function HandbookFooter({ pageNumber, totalPages, recordIdTail }: Props) {
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
      <span>7 天伴随手册 · 个人专属</span>
      <span>档案编号 · {recordIdTail.toUpperCase()}</span>
      <span>
        {pageNumber} / {totalPages}
      </span>
    </div>
  );
}
