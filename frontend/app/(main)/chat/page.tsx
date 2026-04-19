"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/profile-context";
import { trackAction } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: "human" | "ai";
  content: string;
  created_at: string;
}

// Render AI message with markdown-like formatting
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

export default function ChatPage() {
  const { profile } = useProfile();
  const userId = profile.email || "guest";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(
        `${BASE}/api/chat/sessions?userId=${encodeURIComponent(userId)}`,
      );
      const json = await res.json();
      const list: Session[] = json.data ?? [];
      setSessions(list);
      // Auto-select most recent session
      if (list.length > 0 && !activeSessionId) {
        selectSession(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(
        `${BASE}/api/chat/sessions/${sessionId}/messages?userId=${encodeURIComponent(userId)}`,
      );
      const json = await res.json();
      const msgs: Message[] = (json.data ?? []).map(
        (
          m: { role: string; content: string; created_at: string },
          i: number,
        ) => ({
          id: `${i}`,
          role: m.role as "human" | "ai",
          content: m.content,
          created_at: m.created_at,
        }),
      );
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to load messages:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const newChat = async () => {
    try {
      const res = await fetch(`${BASE}/api/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: "New Chat" }),
      });
      const json = await res.json();
      const session: Session = json.data;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${BASE}/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const renameSession = async (sessionId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await fetch(`${BASE}/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editTitle } : s)),
      );
    } catch {}
    setEditingId(null);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch(`${BASE}/api/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: text.slice(0, 40) }),
      });
      const json = await res.json();
      sessionId = json.data.id;
      setSessions((prev) => [json.data, ...prev]);
      setActiveSessionId(sessionId);
    }

    // Optimistic UI
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "human",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Auto-title from first message (fire-and-forget — never blocks send)
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      const title = text.slice(0, 45) + (text.length > 45 ? "..." : "");
      fetch(`${BASE}/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).catch(() => {});
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
      );
    }

    try {
      const apiProfile = {
        gpa: profile.gpa ? parseFloat(profile.gpa) : undefined,
        field_of_study: profile.field_of_study || undefined,
        target_countries: profile.target_countries.length
          ? profile.target_countries
          : undefined,
        goals: profile.goals || undefined,
        budget_range: profile.budget_range || undefined,
      };

      const res = await fetch(
        `${BASE}/api/chat/sessions/${sessionId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            userId,
            userProfile: apiProfile,
          }),
        },
      );
      const json = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: json.data?.response ?? "Sorry, I couldn't get a response.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update session timestamp
      setSessions((prev) =>
        prev
          .map((s) =>
            s.id === sessionId
              ? { ...s, updated_at: new Date().toISOString() }
              : s,
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          ),
      );

      // Track gamification
      if (isFirstMessage) trackAction(userId, "first_chat");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content:
            "Sorry, I couldn't connect to the AI service. Make sure the backend is running.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, activeSessionId, userId, profile, messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mt-8 -mx-6 overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* New chat button */}
        <div className="p-3 border-b border-slate-100">
          <Button
            onClick={newChat}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm h-9"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">
              add
            </span>
            New Chat
          </Button>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 px-3">
                No chats yet. Start a new conversation!
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                    activeSessionId === session.id
                      ? "bg-violet-50 border border-violet-200"
                      : "hover:bg-slate-50 border border-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[16px] shrink-0",
                      activeSessionId === session.id
                        ? "text-violet-500"
                        : "text-slate-400",
                    )}
                  >
                    chat_bubble
                  </span>
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => renameSession(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameSession(session.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs bg-white border border-violet-300 rounded px-1 py-0.5 focus:outline-none"
                      />
                    ) : (
                      <>
                        <p
                          className={cn(
                            "text-xs font-medium truncate",
                            activeSessionId === session.id
                              ? "text-violet-700"
                              : "text-slate-700",
                          )}
                        >
                          {session.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(session.updated_at)}
                        </p>
                      </>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditTitle(session.title);
                      }}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px] text-slate-500">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px] text-red-400">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">
                AI
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">PathPilot AI</p>
            <p className="text-xs text-slate-400">Study Abroad Mentor</p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-xs border-violet-200 text-violet-600 bg-violet-50"
          >
            <span className="material-symbols-outlined text-[12px] mr-1">
              psychology
            </span>
            Llama 3.3 70B
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {!activeSessionId && !loadingMessages && (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
                  <span className="material-symbols-outlined text-[32px] text-white">
                    psychology
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  PathPilot AI Mentor
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Ask me anything about studying abroad — universities,
                  scholarships, visas, ROI, and more.
                </p>
              </div>
            )}

            {loadingMessages && (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "human" ? "flex-row-reverse" : "flex-row",
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
                    msg.role === "human"
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
                      msg.role === "human"
                        ? "text-violet-200"
                        : "text-slate-400",
                    )}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {sending && (
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
        <div className="px-4 py-4 bg-white border-t border-slate-100 shrink-0">
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
              disabled={!input.trim() || sending}
              className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 h-11 w-11 p-0 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
            </Button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
