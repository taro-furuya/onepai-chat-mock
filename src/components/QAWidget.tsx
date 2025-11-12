// src/components/QAWidget.tsx
import React, { useState } from "react";

export default function QAWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "ご質問をどうぞ。納期や仕様などお答えします。" },
  ]);

  const ask = async () => {
    const q = input.trim();
    if (!q) return;
    setLogs((l) => [...l, { role: "user", text: q }]);
    setInput("");

    // TODO: 実APIに差し替え
    const res = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    }).catch(() => null);

    const a = res ? (await res.json()).answer : "ただいま混み合っています。時間をおいてお試しください。";
    setLogs((l) => [...l, { role: "bot", text: a }]);
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!open ? (
        <button
          className="px-4 py-3 rounded-full bg-black text-white shadow-lg"
          onClick={() => setOpen(true)}
        >
          Q&A
        </button>
      ) : (
        <div className="w-[320px] h-[420px] rounded-2xl bg-white shadow-2xl border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="font-semibold">one牌 サポート</div>
            <button className="text-sm" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {logs.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "bot" ? "text-neutral-800" : "text-black text-right"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力"
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button className="px-3 rounded bg-black text-white" onClick={ask}>送信</button>
          </div>
        </div>
      )}
    </div>
  );
}
