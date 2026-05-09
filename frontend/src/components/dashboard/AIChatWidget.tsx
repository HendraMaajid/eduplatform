"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, X, Send, Loader2, Sparkles, Bot, User, Minimize2
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWidgetProps {
  courseId: string;
  courseTitle: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

export default function AIChatWidget({ courseId, courseTitle }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const session = await getSession();
      if (!session?.token) {
        throw new Error("Sesi telah berakhir, silakan login ulang");
      }

      // Send only last 10 messages as history to keep context manageable
      const historyForAPI = newMessages.slice(-10, -1).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          courseId,
          history: historyForAPI,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error: ${response.statusText}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming tidak didukung");

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              // Update last message (assistant)
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Gagal mengirim pesan");
      // Remove the empty assistant message if streaming failed
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && prev[prev.length - 1].content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, messages, courseId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  // Simple markdown-like rendering for bold, code, and lists
  const renderContent = (content: string) => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      // Code blocks
      if (line.startsWith("```")) {
        elements.push(
          <div key={lineIdx} className="ai-chat-code-marker text-xs text-zinc-500 font-mono">
            {line}
          </div>
        );
        return;
      }

      // Headers
      if (line.startsWith("### ")) {
        elements.push(<h4 key={lineIdx} className="font-semibold text-sm mt-2 mb-1">{processInline(line.slice(4))}</h4>);
        return;
      }
      if (line.startsWith("## ")) {
        elements.push(<h3 key={lineIdx} className="font-bold text-sm mt-2 mb-1">{processInline(line.slice(3))}</h3>);
        return;
      }

      // Bullet list
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <div key={lineIdx} className="flex gap-1.5 ml-1">
            <span className="text-[#818cf8] shrink-0 mt-0.5">•</span>
            <span>{processInline(line.slice(2))}</span>
          </div>
        );
        return;
      }

      // Numbered list
      const numberedMatch = line.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        elements.push(
          <div key={lineIdx} className="flex gap-1.5 ml-1">
            <span className="text-[#818cf8] shrink-0 font-medium">{numberedMatch[1]}.</span>
            <span>{processInline(line.slice(numberedMatch[0].length))}</span>
          </div>
        );
        return;
      }

      // Empty line = spacing
      if (line.trim() === "") {
        elements.push(<div key={lineIdx} className="h-1" />);
        return;
      }

      // Regular text
      elements.push(<p key={lineIdx}>{processInline(line)}</p>);
    });

    return elements;
  };

  // Process inline formatting (bold, code, italic)
  const processInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Inline code
      const codeMatch = remaining.match(/`([^`]+)`/);

      let firstMatch: { index: number; length: number; node: React.ReactNode } | undefined = undefined;

      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = {
          index: boldMatch.index,
          length: boldMatch[0].length,
          node: <strong key={key++} className="font-semibold">{boldMatch[1]}</strong>,
        };
      }
      if (codeMatch && codeMatch.index !== undefined) {
        if (!firstMatch || codeMatch.index < firstMatch.index) {
          firstMatch = {
            index: codeMatch.index,
            length: codeMatch[0].length,
            node: (
              <code key={key++} className="px-1 py-0.5 rounded bg-zinc-800 text-emerald-400 text-xs font-mono">
                {codeMatch[1]}
              </code>
            ),
          };
        }
      }

      if (firstMatch) {
        if (firstMatch.index > 0) {
          parts.push(remaining.slice(0, firstMatch.index));
        }
        parts.push(firstMatch.node);
        remaining = remaining.slice(firstMatch.index + firstMatch.length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-chat-fab"
          aria-label="Buka AI Teman Belajar"
          id="ai-chat-fab"
        >
          <Sparkles className="h-6 w-6 text-white" />
          <span className="ai-chat-fab-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel" id="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="flex items-center gap-2.5">
              <div className="ai-chat-avatar">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">AI Teman Belajar</h3>
                <p className="text-[10px] text-white/60 truncate max-w-[200px]">{courseTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Tutup chat"
              >
                <Minimize2 className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">
                  <Sparkles className="h-8 w-8 text-[#818cf8]" />
                </div>
                <h4 className="font-semibold text-sm text-white">Halo! 👋</h4>
                <p className="text-xs text-slate-300 text-center leading-relaxed">
                  Saya AI Teman Belajar yang siap membantu kamu memahami materi kursus ini. Tanya apa saja!
                </p>
                <div className="ai-chat-suggestions">
                  {[
                    "Jelaskan materi ini secara singkat",
                    "Apa poin penting dari kursus ini?",
                    "Bantu saya memahami konsep dasar",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="ai-chat-suggestion-btn"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-chat-message ${msg.role === "user" ? "ai-chat-message-user" : "ai-chat-message-assistant"}`}
              >
                <div className={`ai-chat-message-avatar ${msg.role === "user" ? "ai-chat-message-avatar-user" : "ai-chat-message-avatar-ai"}`}>
                  {msg.role === "user" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
                <div className={`ai-chat-bubble ${msg.role === "user" ? "ai-chat-bubble-user" : "ai-chat-bubble-ai"}`}>
                  {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                    <div className="ai-chat-typing">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <div className="text-[13px] leading-relaxed space-y-0.5">
                      {renderContent(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="mx-4 my-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya tentang materi..."
                rows={1}
                disabled={isStreaming}
                className="ai-chat-textarea"
                id="ai-chat-input"
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="ai-chat-send-btn ai-chat-stop-btn"
                  aria-label="Stop"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="ai-chat-send-btn"
                  aria-label="Kirim"
                  id="ai-chat-send"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-1.5 opacity-60">
              AI dapat membuat kesalahan. Verifikasi informasi penting.
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Floating Action Button */
        .ai-chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4), 0 0 0 0 rgba(79, 70, 229, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 50;
          animation: ai-fab-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ai-chat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(79, 70, 229, 0.5);
        }
        .ai-chat-fab-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(79, 70, 229, 0.4);
          animation: ai-fab-pulse 2s ease-in-out infinite;
        }

        @keyframes ai-fab-entrance {
          from { transform: scale(0) rotate(-180deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ai-fab-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
        }

        /* Chat Panel */
        .ai-chat-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-height: min(600px, calc(100vh - 48px));
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9999;
          animation: ai-panel-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #1e293b;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        @media (max-width: 420px) {
          .ai-chat-panel {
            width: calc(100vw - 16px);
            bottom: 8px;
            right: 8px;
            max-height: calc(100vh - 16px);
            border-radius: 12px;
          }
        }
        @keyframes ai-panel-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Header */
        .ai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-bottom: 1px solid #1e293b;
          flex-shrink: 0;
        }
        .ai-chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Messages */
        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          scroll-behavior: smooth;
          min-height: 0;
        }
        .ai-chat-messages::-webkit-scrollbar { width: 4px; }
        .ai-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .ai-chat-messages::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 2px;
        }

        /* Welcome */
        .ai-chat-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px 16px;
        }
        .ai-chat-welcome-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(129, 140, 248, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .ai-chat-suggestions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }
        .ai-chat-suggestion-btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #1e293b;
          background: #0f172a;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          color: #cbd5e1;
        }
        .ai-chat-suggestion-btn:hover {
          border-color: #4f46e5;
          background: rgba(79, 70, 229, 0.1);
        }

        /* Message Bubbles */
        .ai-chat-message {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          animation: ai-msg-in 0.3s ease-out;
        }
        .ai-chat-message-user {
          flex-direction: row-reverse;
        }
        @keyframes ai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-chat-message-avatar {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ai-chat-message-avatar-user {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
        }
        .ai-chat-message-avatar-ai {
          background: #1e293b;
          color: #94a3b8;
        }
        .ai-chat-bubble {
          max-width: 85%;
          padding: 8px 12px;
          border-radius: 12px;
          word-break: break-word;
        }
        .ai-chat-bubble-user {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .ai-chat-bubble-ai {
          background: #1e293b;
          color: #f8fafc;
          border-bottom-left-radius: 4px;
        }

        /* Typing Indicator */
        .ai-chat-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .ai-chat-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94a3b8;
          animation: ai-typing-bounce 1.4s infinite;
        }
        .ai-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ai-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* Input Area */
        .ai-chat-input-area {
          padding: 10px 12px;
          border-top: 1px solid #1e293b;
          flex-shrink: 0;
          background: #0f172a;
        }
        .ai-chat-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 6px 6px 6px 12px;
          border-radius: 12px;
          border: 1px solid #1e293b;
          background: #020617;
          transition: border-color 0.2s;
        }
        .ai-chat-input-wrapper:focus-within {
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }
        .ai-chat-textarea {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          resize: none;
          font-size: 13px;
          line-height: 1.5;
          max-height: 80px;
          color: #f8fafc;
          padding: 4px 0;
        }
        .ai-chat-textarea::placeholder {
          color: #475569;
        }
        .ai-chat-send-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #4f46e5;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .ai-chat-send-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(1.05);
        }
        .ai-chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ai-chat-stop-btn {
          background: #ef4444;
        }
      `}</style>
    </>
  );
}
