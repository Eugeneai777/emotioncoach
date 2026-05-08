interface Props {
  title: string;
}
export function HandbookHeader({ title }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "12px",
        marginBottom: "20px",
        borderBottom: "1px solid hsl(var(--border))",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
      }}
    >
      <span style={{ fontWeight: 500 }}>{title}</span>
      <span>有劲 AI · 7 天伴随手册</span>
    </div>
  );
}
