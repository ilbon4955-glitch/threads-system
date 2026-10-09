"use client";

import {
  Check,
  Clipboard,
  Copy,
  Moon,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { JP_PERSONAS, type ContentMode, type GenerateResult, type HistoryItem } from "@/lib/types";

const STORAGE = {
  theme: "threads-theme",
  apiKey: "threads-gemini-key",
  amazon: "threads-amazon-link",
  history: "threads_history",
} as const;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "Î≥µÏÇ¨?? : label}
    </button>
  );
}

function Chip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-card-border bg-background/70 px-3 py-1 text-sm"
    >
      <span className="max-w-[16rem] truncate">{text}</span>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  );
}

function fileToBase64(file: File): Promise<{ name: string; mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("?åÏùº???ΩÏ? Î™ªÌñà?µÎãà??"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        data: result.includes(",") ? result.split(",")[1] : result,
      });
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [apiKey, setApiKey] = useState("");
  const [amazonLink, setAmazonLink] = useState("");
  const [mode, setMode] = useState<ContentMode>("shopping");
  const [langTab, setLangTab] = useState<"ja" | "en">("ja");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE.theme);
    const nextTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setApiKey(localStorage.getItem(STORAGE.apiKey) ?? "");
    setAmazonLink(localStorage.getItem(STORAGE.amazon) ?? "");
    try {
      const saved = localStorage.getItem(STORAGE.history);
      if (saved) setHistory(JSON.parse(saved) as HistoryItem[]);
    } catch {
      setHistory([]);
    }
  }, []);

  function persistTheme(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem(STORAGE.theme, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function persistHistory(next: HistoryItem[]) {
    setHistory(next);
    localStorage.setItem(STORAGE.history, JSON.stringify(next));
  }

  async function onGenerate() {
    setBusy(true);
    setError("");
    try {
      localStorage.setItem(STORAGE.apiKey, apiKey);
      localStorage.setItem(STORAGE.amazon, amazonLink);
      const media = await Promise.all(files.map(fileToBase64));
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          amazonLink,
          mode,
          sourceText,
          sourceUrl,
          files: media,
        }),
      });
      const data = (await response.json()) as GenerateResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "?ùÏÑ±???§Ìå®?àÏäµ?àÎã§.");
      setResult(data);
      const title =
        sourceText.trim().slice(0, 24) ||
        sourceUrl.replace(/^https?:\/\//, "").slice(0, 24) ||
        data.amazonKeywords[0] ||
        "???ùÏÑ± Í∏∞Î°ù";
      persistHistory([
        {
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          title,
          mode,
          result: data,
        },
        ...history.slice(0, 29),
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "?ùÏÑ±???§Ìå®?àÏäµ?àÎã§.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-card-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                Threads Viral Lab
              </p>
              <h1 className="text-lg font-semibold sm:text-xl">?ºÎ≥∏ 2030 ¬∑ ?ºÏñ¥ 16Ï¢?/ ?ÅÏñ¥ 8Ï¢?/h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen((open) => !open)}
                className="rounded-full border border-card-border px-3 py-2 text-sm"
              >
                ?ïí ?¥Ï†Ñ Í∏∞Î°ù Î≥¥Í???
              </button>
              <button
                type="button"
                aria-label="?åÎßà ?ÑÌôò"
                onClick={() => persistTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-card-border"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-2xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none"
            />
            <input
              type="text"
              placeholder="?ÑÎßàÏ°??¥ÏÜå?úÏóê?¥Ìä∏ ?®Ï∂ïÎßÅÌÅ¨ / ID"
              value={amazonLink}
              onChange={(event) => setAmazonLink(event.target.value)}
              className="w-full rounded-2xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        {historyOpen ? (
          <aside className="rounded-3xl border border-card-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">?ùÏÑ± Í∏∞Î°ù</h2>
              {history.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-accent"
                  onClick={() => persistHistory([])}
                >
                  ?ÑÏ≤¥ ??†ú
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-muted">Ï¥àÏΩúÎ¶? ?∏Ï†ú ???¥Ï†Ñ ?ùÏÑ±???¨Í∏∞???ìÏûÖ?àÎã§.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => setResult(item.result)}
                      className="min-w-0 flex-1 rounded-xl bg-background/70 px-3 py-2 text-left"
                    >
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="text-[10px] text-muted">
                        {new Date(item.createdAt).toLocaleString("ko-KR")}
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Í∏∞Î°ù ??†ú"
                      onClick={() => persistHistory(history.filter((row) => row.id !== item.id))}
                      className="p-2 text-muted hover:text-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}

        <main className="space-y-6">
          <section className="rounded-3xl border border-card-border bg-card p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("shopping")}
                className={`rounded-full px-4 py-1.5 text-sm ${mode === "shopping" ? "bg-foreground text-background" : "border border-card-border text-muted"}`}
              >
                Î™®Îìú A: ÍøÄ???ºÌïë
              </button>
              <button
                type="button"
                onClick={() => setMode("daily")}
                className={`rounded-full px-4 py-1.5 text-sm ${mode === "daily" ? "bg-foreground text-background" : "border border-card-border text-muted"}`}
              >
                Î™®Îìú B: ?ºÏÉÅ/Í≥µÍ∞ê/?êÎßÅ
              </button>
            </div>
            <textarea
              rows={7}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Î∂ÑÏÑù???êÎ¨∏ ?çÏä§??
              className="mb-3 w-full rounded-2xl border border-card-border bg-background/60 px-4 py-3 text-sm outline-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="?åÏû¨ ÎßÅÌÅ¨ (Threads / Instagram / Í∏∞ÏÇ¨ URL)"
                className="w-full rounded-2xl border border-card-border bg-background/60 px-4 py-2.5 text-sm outline-none"
              />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))}
                className="w-full rounded-2xl border border-card-border bg-background/60 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onGenerate}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {busy ? "Î∂ÑÏÑù¬∑?ùÏÑ± Ï§ë‚Ä? : "Î∂ÑÏÑù?òÍ≥† 24Ï¢?Ïπ¥Ìîº ?ùÏÑ±"}
            </button>
            {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
          </section>

          {result ? (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-3xl border border-card-border bg-card p-5">
                  <h2 className="font-semibold">?êÎ¨∏ 1:1 ÏßÅÏó≠</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                    {result.koreanTranslation || "Î≤àÏó≠ ?ÜÏùå"}
                  </p>
                </article>
                <article className="rounded-3xl border border-card-border bg-card p-5">
                  <h2 className="font-semibold">???∞Ï°å?îÍ??</h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {result.viralTriggers.map((line, index) => (
                      <li key={`${line}-${index}`}>
                        {index + 1}. {line}
                      </li>
                    ))}
                  </ol>
                </article>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-3xl border border-card-border bg-card p-5">
                  <h2 className="mb-3 font-semibold">?ì± ?§Ïò§?çÏäà Í≤Ä?âÏñ¥</h2>
                  <div className="flex flex-wrap gap-2">
                    {result.xiaohongshuKeywords.map((keyword) => (
                      <Chip key={keyword} text={keyword} />
                    ))}
                  </div>
                </article>
                <article className="rounded-3xl border border-card-border bg-card p-5">
                  <h2 className="mb-3 font-semibold">?õí ?ºÎ≥∏ ?ÑÎßàÏ°?Í≤Ä?âÏñ¥</h2>
                  <div className="flex flex-wrap gap-2">
                    {result.amazonKeywords.map((keyword) => (
                      <Chip key={keyword} text={keyword} />
                    ))}
                  </div>
                </article>
              </section>

              <section className="rounded-3xl border border-card-border bg-card p-5">
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLangTab("ja")}
                    className={`rounded-full px-4 py-1.5 text-sm ${langTab === "ja" ? "bg-foreground text-background" : "border border-card-border text-muted"}`}
                  >
                    ?ºÎ≥∏??16Ï¢?
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangTab("en")}
                    className={`rounded-full px-4 py-1.5 text-sm ${langTab === "en" ? "bg-foreground text-background" : "border border-card-border text-muted"}`}
                  >
                    ?ÅÏñ¥ 8Ï¢?
                  </button>
                </div>

                {langTab === "ja"
                  ? JP_PERSONAS.map((persona) => (
                      <div key={persona.id} className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-muted">{persona.label}</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {(result.japanese[persona.id] ?? []).map((copy, index) => (
                            <article
                              key={`${persona.id}-${index}`}
                              className="rounded-2xl border border-card-border bg-background/50 p-4"
                            >
                              <p className="whitespace-pre-wrap text-[15px] leading-7">{copy.ja}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{copy.jp_ko}</p>
                              <div className="mt-3">
                                <CopyButton value={copy.ja} label="?ºÎ≥∏??Î≥µÏÇ¨" />
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))
                  : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.english.map((copy, index) => (
                        <article
                          key={`en-${index}`}
                          className="rounded-2xl border border-card-border bg-background/50 p-4"
                        >
                          <p className="whitespace-pre-wrap text-[15px] leading-7">{copy.en}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{copy.en_ko}</p>
                          <div className="mt-3">
                            <CopyButton value={copy.en} label="?ÅÏñ¥ Î≥µÏÇ¨" />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
              </section>

              <section className="rounded-3xl border border-card-border bg-card p-5">
                <h2 className="font-semibold">Íµ¨Îß§ ÎßÅÌÅ¨ 2Ï∞??ÑÌÇπ ?ìÍ? 3Ï¢?/h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {result.comments.map((comment, index) => (
                    <article
                      key={`c-${index}`}
                      className="rounded-2xl border border-card-border bg-background/50 p-4"
                    >
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{comment.ja}</pre>
                      <p className="mt-2 text-sm text-muted">{comment.ko}</p>
                      <div className="mt-3">
                        <CopyButton value={comment.ja} label="?ìã ?ÑÏ≤¥ Î≥µÏÇ¨" />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
