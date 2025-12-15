import { useState } from "react";
import { MoreVertical, Plus, Ban, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DisableAccountDialog } from "./DisableAccountDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface UserActionMenuProps {
  userId: string;
  userName: string;
  isDisabled: boolean;
  onRecharge: () => void;
  onRefresh: () => void;
}

export function UserActionMenu({
  userId,
  userName,
  isDisabled,
  onRecharge,
  onRefresh,
}: UserActionMenuProps) {
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRecharge}>
            <Plus className="mr-2 h-4 w-4" />
            充值
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDisableDialogOpen(true)}
            className={isDisabled ? "text-green-600" : "text-orange-600"}
          >
            {isDisabled ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                恢复账号
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                停用账号
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除账号
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DisableAccountDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        userId={userId}
        userName={userName}
        isCurrentlyDisabled={isDisabled}
        onSuccess={onRefresh}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userId={userId}
        userName={userName}
        onSuccess={onRefresh}
      />
    </>
  );
}
