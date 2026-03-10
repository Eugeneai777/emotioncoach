import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

interface AddressManagerProps {
  userId: string | null;
  selectedId: string | null;
  onSelect: (address: SavedAddress) => void;
  onAddNew: () => void;
}

export function AddressManager({ userId, selectedId, onSelect, onAddNew }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_shipping_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAddresses(data as SavedAddress[]);
        // Auto-select default if none selected
        if (!selectedId && data.length > 0) {
          const defaultAddr = data.find((a: any) => a.is_default) || data[0];
          onSelect(defaultAddr as SavedAddress);
        }
      }
    } catch (e) {
      console.error("Load addresses error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("user_shipping_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  if (!userId || addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">已保存地址</p>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => onSelect(addr)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors text-left",
              selectedId === addr.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{addr.name}</span>
                  <span className="text-muted-foreground">{addr.phone}</span>
                  {addr.is_default && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">默认</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  <MapPin className="w-3 h-3 inline mr-0.5" />
                  {addr.province}{addr.city}{addr.district} {addr.detail}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedId === addr.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDelete(addr.id, e)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={onAddNew}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        使用新地址
      </Button>
    </div>
  );
}
