import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Send,
  Bot,
  User,
  Paperclip,
  Mic,
  Lightbulb,
  Image,
  Search,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Lottie from "lottie-react";
import chatBotAnimation from "../../Live chatbot.json";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DatabaseContext {
  assets: any[];
  designers: any[];
  brands: any[];
  providers: any[];
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dbContext, setDbContext] = useState<DatabaseContext | null>(null);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const apiKey = "AIzaSyAe7Oe7QrsrjMBSPQ6nCjtFgtPXEGbn5eI";

  // Fetch database context on mount
  useEffect(() => {
    const fetchContext = async () => {
      if (!supabase) return;

      try {
        const [assetsRes, designersRes, brandsRes, providersRes] = await Promise.all([
          supabase.from("assets").select(`
            id, game_name, status, found_by, date_found, notes,
            provider:providers(name),
            designer:designers(name, email)
          `),
          supabase.from("designers").select("id, name, email"),
          supabase.from("brands").select("id, name"),
          supabase.from("providers").select("id, name"),
        ]);

        setDbContext({
          assets: assetsRes.data || [],
          designers: designersRes.data || [],
          brands: brandsRes.data || [],
          providers: providersRes.data || [],
        });
      } catch (error) {
        console.error("Failed to fetch database context:", error);
      }
    };

    fetchContext();
  }, []);

  const buildSystemPrompt = () => {
    const basePrompt = `You are  AI, an assistant for the  application - a tool for tracking missing game assets in an online casino/gaming company.

Your knowledge is LIMITED to these topics only:
- Missing game assets (images, thumbnails, banners) for casino games
- Asset statuses: not-started, ongoing, completed, exported, uploaded
- Designers who work on assets
- Brands that need assets reflected
- Providers (game studios)
- Workflow: Finding missing assets → Assigning to designer → Design work → Export → Upload → Reflect to brands

You can help with:
- Answering questions about current assets and their statuses
- Telling users which assets are assigned to which designer
- Reporting on asset progress
- Explaining asset tracking workflows
- Suggesting how to prioritize missing assets
- Drafting messages to designers about pending work

If a user asks who created you, answer: "Jolo Tadeo".

DO NOT answer questions unrelated to asset management, game assets, or this application. Politely redirect users back to asset-related topics.

Keep responses concise and professional. Use Markdown formatting for better readability:
- Use **bold** for emphasis
- Use bullet points for lists
- Use \`code\` for technical terms
- Use headings (##) to organize longer responses`;

    if (!dbContext) return basePrompt;

    const assetsInfo = dbContext.assets.map((a) => ({
      game: a.game_name,
      provider: a.provider?.name || "Unknown",
      status: a.status,
      designer: a.designer?.name || "Unassigned",
      foundBy: a.found_by,
      dateFound: a.date_found,
      notes: a.notes,
    }));

    const designersInfo = dbContext.designers.map((d) => d.name);
    const brandsInfo = dbContext.brands.map((b) => b.name);
    const providersInfo = dbContext.providers.map((p) => p.name);

    return `${basePrompt}

CURRENT DATABASE STATE (Use this to answer user questions):

PROVIDERS: ${providersInfo.join(", ")}

BRANDS: ${brandsInfo.join(", ")}

DESIGNERS: ${designersInfo.join(", ")}

MISSING ASSETS (${assetsInfo.length} total):
${assetsInfo.map((a) => `- "${a.game}" (${a.provider}) - Status: ${a.status}, Designer: ${a.designer}, Found by: ${a.foundBy} on ${a.dateFound}${a.notes ? `, Notes: ${a.notes}` : ""}`).join("\n")}

STATUS SUMMARY:
- Not Started: ${assetsInfo.filter((a) => a.status === "not-started").length}
- Ongoing: ${assetsInfo.filter((a) => a.status === "ongoing").length}
- Completed: ${assetsInfo.filter((a) => a.status === "completed").length}
- Exported: ${assetsInfo.filter((a) => a.status === "exported").length}
- Uploaded: ${assetsInfo.filter((a) => a.status === "uploaded").length}`;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: buildSystemPrompt() }],
            },
            contents: [{ role: "user", parts: [{ text: trimmed }] }],
          }),
        }
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't find an answer right now.";

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Chat error",
        description: "Could not reach the assistant. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into an issue. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasMessages = messages.length > 0;

  const actionButtons = [
    { icon: Paperclip, label: "Attach File" },
    { icon: Lightbulb, label: "Reasoning" },
    { icon: Image, label: "Create Image" },
    { icon: Search, label: "Deep Research" },
  ];

  return (
    <AppLayout>
      <div className="relative flex h-full flex-col overflow-hidden">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-background to-orange-50/40 dark:from-blue-950/20 dark:via-background dark:to-orange-950/10" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-900/20" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-900/10" />

        {/* Content */}
        <div
          ref={containerRef}
          className="relative z-10 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-4xl px-4 py-8">
            {/* Hero section - only show when no messages */}
            {!hasMessages && (
              <div className="flex flex-col items-center pt-8 text-center">
                <h1 className="text-2xl font-medium text-foreground sm:text-3xl">
                  <span className="text-primary">Hi there,</span>{" "}
                  <span className="text-foreground/80">Ready to</span>
                  <br />
                  <span className="text-foreground">Achieve Great Things?</span>
                </h1>

                <div className="mt-10 mb-8 flex items-center justify-center">
                  <Lottie
                    animationData={chatBotAnimation}
                    loop
                    autoplay
                    className="h-50 w-50 sm:h-48 sm:w-48"
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            {hasMessages && (
              <div className="space-y-4 pb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "assistant"
                          ? "bg-white text-foreground shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/5"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-slate-100 prose-pre:dark:bg-slate-900 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="my-1 last:mb-0 first:mt-0">{children}</p>,
                              ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
                              ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
                              li: ({ children }) => <li className="my-0.5">{children}</li>,
                              code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-primary dark:bg-slate-900">{children}</code>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input card */}
        <div className="relative z-10 px-4 pb-4">
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/5">
            {/* Input area */}
            <div className="p-3">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Initiate a query or send a command to the AI..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{
                    minHeight: "32px",
                    maxHeight: "120px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {actionButtons.map((btn) => (
                  <button
                    key={btn.label}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <btn.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{btn.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                  <Mic className="h-4 w-4" />
                </button>
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isSending}
                  className="h-8 w-8 rounded-full"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
