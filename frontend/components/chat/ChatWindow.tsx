"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, UserProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (t.startsWith("- ") || t.startsWith("• "))
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
              <span>{t.slice(2)}</span>
            </div>
          );
        if (/^\d+\.\s/.test(t)) {
          const [num, ...rest] = t.split(". ");
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 text-violet-500 font-semibold text-xs mt-0.5">
                {num}.
              </span>
              <span>{rest.join(". ")}</span>
            </div>
          );
        }
        if (t.endsWith(":") && t.length < 60)
          return (
            <p key={i} className="font-semibold text-slate-800 mt-2">
              {t}
            </p>
          );
        return <p key={i}>{t}</p>;
      })}
    </div>
  );
}

export default function ChatWindow({
  profile,
  sessionId = "default",
}: {
  profile?: UserProfile;
  sessionId?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Hi! I'm PathPilot AI, your study abroad mentor. I can help you with university selection, scholarships, visa guidance, and more. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chat(text, sessionId, profile);
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: res.response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content:
            "Sorry, I couldn't connect to the AI service. Please make sure the backend is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, sessionId, profile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-violet-600 text-white text-sm font-bold">
              AI
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">PathPilot AI</p>
          <p className="text-xs text-slate-400">Study Abroad Mentor</p>
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-xs border-violet-200 text-violet-600 bg-violet-50"
        >
          <span className="material-symbols-outlined text-[14px] mr-1">
            psychology
          </span>
          Llama 3.3 70B
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 bg-slate-50/50">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {msg.role === "ai" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-sm"
                    : "bg-white text-slate-800 rounded-tl-sm border border-slate-100",
                )}
              >
                {msg.role === "ai" ? (
                  <MessageContent content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                <p
                  className={cn(
                    "text-[10px] mt-1.5",
                    msg.role === "user" ? "text-violet-200" : "text-slate-400",
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about universities, scholarships, visas..."
            rows={1}
            className="resize-none bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-400 min-h-[44px] max-h-32"
          />
          <Button
            onClick={send}
            disabled={!input.trim() || loading}
            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 h-11 w-11 p-0 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </Button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
