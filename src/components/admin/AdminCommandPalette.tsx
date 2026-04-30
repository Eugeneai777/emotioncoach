import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { buildAdminCommands } from "./adminNavRegistry";
import type { AdminRole } from "./AdminLayout";

interface Props {
  userRole: AdminRole;
}

export function AdminCommandPalette({ userRole }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = useMemo(
    () => buildAdminCommands().filter((c) => c.roles.includes(userRole)),
    [userRole]
  );

  // 按分组聚合
  const grouped = useMemo(() => {
    const map = new Map<string, typeof commands>();
    commands.forEach((c) => {
      if (!map.has(c.group)) map.set(c.group, [] as any);
      (map.get(c.group) as any).push(c);
    });
    return Array.from(map.entries());
  }, [commands]);

  const go = (path: string) => {
    setOpen(false);
    setTimeout(() => navigate(path), 0);
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        aria-label="搜索后台功能"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline truncate">
          搜索功能、页面或关键词…
        </span>
        <span className="sm:hidden truncate">搜索功能…</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="输入功能名、关键词（如：男人有劲、绽放、漏斗、订单…）" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>未找到匹配功能，换个关键词试试</CommandEmpty>
          {grouped.map(([groupName, items], gi) => (
            <div key={groupName}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={groupName}>
                {items.map((c) => (
                  <CommandItem
                    key={c.key}
                    value={`${c.label} ${c.parentLabel || ""} ${c.keywords.join(" ")} ${c.path}`}
                    onSelect={() => go(c.path)}
                    className="cursor-pointer"
                  >
                    <c.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="truncate">{c.label}</span>
                      {c.parentLabel && (
                        <span className="text-xs text-muted-foreground truncate">
                          · {c.parentLabel}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 text-[10px] text-muted-foreground/70 truncate max-w-[180px] hidden md:inline">
                      {c.path}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
