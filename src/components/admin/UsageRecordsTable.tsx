import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export function UsageRecordsTable() {
  const [search, setSearch] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ['admin-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  const filteredRecords = records?.filter(record => 
    record.user_id.toLowerCase().includes(search.toLowerCase()) ||
    record.source.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索用户ID或来源..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户ID</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>消耗次数</TableHead>
            <TableHead>时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords?.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-mono text-sm">{record.user_id.slice(0, 8)}...</TableCell>
              <TableCell>
                <Badge variant="outline">{record.record_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge>{record.source}</Badge>
              </TableCell>
              <TableCell>{record.amount}</TableCell>
              <TableCell>{format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
