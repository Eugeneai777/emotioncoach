import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users, MessageCircle, Star, Calendar } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  intimacyLevel: number;
  lastContact: Date;
  notes: string;
}

interface ContactLog {
  id: string;
  contactId: string;
  content: string;
  date: Date;
}

export const RelationshipTracker = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // 表单状态
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [intimacyLevel, setIntimacyLevel] = useState("3");
  const [notes, setNotes] = useState("");
  const [logContent, setLogContent] = useState("");

  const relationshipTypes = [
    "家人",
    "伴侣",
    "密友",
    "朋友",
    "同事",
    "同学",
    "邻居",
    "其他",
  ];

  const handleAddContact = () => {
    if (!name || !relationship) {
      toast({
        title: "请填写完整信息",
        description: "姓名和关系为必填项",
        variant: "destructive",
      });
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      relationship,
      intimacyLevel: parseInt(intimacyLevel),
      lastContact: new Date(),
      notes,
    };

    setContacts([newContact, ...contacts]);
    setName("");
    setRelationship("");
    setIntimacyLevel("3");
    setNotes("");
    setShowAddForm(false);

    toast({
      title: "联系人已添加",
      description: `已添加 ${name}`,
    });
  };

  const handleAddLog = () => {
    if (!selectedContact || !logContent) {
      toast({
        title: "请填写互动记录",
        variant: "destructive",
      });
      return;
    }

    const newLog: ContactLog = {
      id: Date.now().toString(),
      contactId: selectedContact,
      content: logContent,
      date: new Date(),
    };

    setLogs([newLog, ...logs]);
    
    // 更新最后联系时间
    setContacts(
      contacts.map((c) =>
        c.id === selectedContact ? { ...c, lastContact: new Date() } : c
      )
    );

    setLogContent("");
    toast({
      title: "记录已添加",
    });
  };

  const getContactLogs = (contactId: string) => {
    return logs.filter((log) => log.contactId === contactId);
  };

  const getIntimacyColor = (level: number) => {
    if (level >= 4) return "text-red-600";
    if (level >= 3) return "text-orange-600";
    return "text-yellow-600";
  };

  const selectedContactData = contacts.find((c) => c.id === selectedContact);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            人际关系管理
          </CardTitle>
          <CardDescription>维护关系，珍惜每一份联结</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">联系人</p>
                    <p className="text-2xl font-bold text-pink-600">{contacts.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">互动记录</p>
                    <p className="text-2xl font-bold text-purple-600">{logs.length}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">亲密关系</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {contacts.filter((c) => c.intimacyLevel >= 4).length}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 添加联系人按钮 */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              添加联系人
            </Button>
          )}

          {/* 添加联系人表单 */}
          {showAddForm && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    placeholder="输入姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>关系</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择关系" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>亲密度 (1-5)</Label>
                  <Select value={intimacyLevel} onValueChange={setIntimacyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">⭐ 一般</SelectItem>
                      <SelectItem value="2">⭐⭐ 熟悉</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ 友好</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ 亲密</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ 非常亲密</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>备注</Label>
                  <Textarea
                    placeholder="添加一些备注信息"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddContact} className="flex-1">
                  确认添加
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* 联系人列表 */}
          <div className="space-y-2">
            <h3 className="font-semibold">联系人列表</h3>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无联系人，开始添加吧
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={`cursor-pointer transition-colors ${
                      selectedContact === contact.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedContact(contact.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{contact.relationship}</span>
                              <span className={getIntimacyColor(contact.intimacyLevel)}>
                                {"⭐".repeat(contact.intimacyLevel)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {contact.lastContact.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 互动记录 */}
          {selectedContactData && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">
                与 {selectedContactData.name} 的互动记录
              </h3>

              <div className="space-y-2">
                <Label>添加新记录</Label>
                <Textarea
                  placeholder="记录你们的互动..."
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                />
                <Button onClick={handleAddLog} className="w-full">
                  添加记录
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getContactLogs(selectedContact!).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无互动记录
                  </p>
                ) : (
                  getContactLogs(selectedContact!).map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-3">
                        <p className="text-sm">{log.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.date.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
