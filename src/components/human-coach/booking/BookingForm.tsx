import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BookingFormProps {
  userNotes: string;
  onNotesChange: (notes: string) => void;
}

export function BookingForm({ userNotes, onNotesChange }: BookingFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground">填写留言</h3>
      
      <div className="space-y-2">
        <Label htmlFor="user-notes">咨询主题/问题描述（选填）</Label>
        <Textarea
          id="user-notes"
          placeholder="请简要描述您希望咨询的问题或期望达成的目标，这将帮助教练更好地准备..."
          value={userNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={5}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {userNotes.length}/500
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">温馨提示：</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>请准时参加预约，如需取消请提前24小时操作</li>
          <li>建议在安静、私密的环境中进行咨询</li>
          <li>您提供的信息将严格保密</li>
        </ul>
      </div>
    </div>
  );
}
