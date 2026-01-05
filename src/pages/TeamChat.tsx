import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, User, MessageSquare, Search } from "lucide-react";
import { useDesigners } from "@/hooks/useData";
import { useMessages, useUnreadCounts } from "@/hooks/useData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

export default function TeamChat() {
  const { profile } = useCurrentUser();
  const { designers } = useDesigners();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Find current designer by email
  const currentDesigner = designers.find((d) => d.email === profile?.email);
  
  const { messages, sendMessage, markAsRead, refetch } = useMessages(
    currentDesigner?.id || "",
    selectedUserId
  );
  const { counts, refetch: refetchCounts } = useUnreadCounts(currentDesigner?.id || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter out current user from the list
  const otherDesigners = designers
    .filter((d) => d.id !== currentDesigner?.id)
    .filter((d) => 
      searchQuery === "" || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (selectedUserId) {
      markAsRead();
      refetchCounts();
    }
  }, [selectedUserId, markAsRead, refetchCounts]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedUserId, refetch]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;
    await sendMessage(messageInput);
    setMessageInput("");
  };

  const selectedUser = designers.find((d) => d.id === selectedUserId);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Team Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Send personal messages to your team members
          </p>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Sidebar - Team Members List */}
          <Card className="w-80 flex flex-col shadow-lg">
            <div className="p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Team Members
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="p-2">
                {otherDesigners.map((designer) => (
                  <button
                    key={designer.id}
                    onClick={() => setSelectedUserId(designer.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all text-left mb-1",
                      selectedUserId === designer.id && "bg-accent shadow-sm"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-background">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {designer.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {counts[designer.id] > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-destructive-foreground font-bold">
                            {counts[designer.id] > 9 ? '9+' : counts[designer.id]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{designer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {designer.email}
                      </p>
                    </div>
                  </button>
                ))}
                {otherDesigners.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {searchQuery ? "No members found" : "No team members found"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Main Chat Area */}
          <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-background">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {selectedUser.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{selectedUser.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6 bg-muted/10">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Start the conversation with {selectedUser.name}
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isSentByMe = message.senderId === currentDesigner?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2 items-end",
                              isSentByMe ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isSentByMe && (
                              <Avatar className="h-8 w-8 mb-1">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {selectedUser.avatar}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                                isSentByMe
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-background border rounded-bl-sm"
                              )}
                            >
                              <p className="break-words text-sm leading-relaxed">
                                {message.content}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] mt-1.5 font-medium",
                                  isSentByMe
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                )}
                              >
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                            {isSentByMe && (
                              <Avatar className="h-8 w-8 mb-1">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {currentDesigner?.avatar}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-3 max-w-4xl mx-auto">
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 h-11"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      size="icon"
                      className="h-11 w-11 shrink-0"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
                <div className="text-center px-6">
                  <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-primary/40" />
                  </div>
                  <p className="text-xl font-semibold text-foreground mb-2">
                    No conversation selected
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Choose a team member from the list to start messaging and collaborate
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
