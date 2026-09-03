"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Link2,
  LoaderCircle,
  ShoppingBag,
  Sparkles,
  History,
  Trash2,
  Search,
  MessageSquareShare,
} from "lucide-react";
import type { ContentMode, GenerateResult } from "@/lib/types";

interface CopyItem {
  ja: string;
  ko: string;
  commentHook?: string;
  commentHookKo?: string;
  passed?: boolean;
}

interface ExtendedResult extends Omit<GenerateResult, "shortCopies" | "paragraphCopies"> {
  summaryTitle?: string;
  shortCopies?: CopyItem[];
  paragraphCopies?: CopyItem[];
}

interface HistoryItem {
  id: string;
  createdAt: string;
  mode: ContentMode;
  title: string;
  data: ExtendedResult;
}

const STORAGE_KEY = "threads_copy_history_v1";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<ContentMode>("shopping");
  const [amazonLink, setAmazonLink] = useState("");
  const [files, setFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtendedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
      const savedKey = localStorage.getItem("threads_gemini_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch {
      // ignore
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("threads_gemini_api_key", val);
  };

  const saveToHistory = (res: ExtendedResult, currentMode: ContentMode) => {
    const title = res.summaryTitle || res.koreanTranslation?.slice(0, 16).replace(/\n/g, " ") || "새 바이럴 카피";
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      mode: currentMode,
      title,
      data: res,
    };
    const nextHistory = [newItem, ...history.filter((h) => h.id !== newItem.id)].slice(0, 30);
    setHistory(nextHistory);
    setSelectedHistoryId(newItem.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
      setResult(null);
    }
  };

  const clearAllHistory = () => {
    if (!confirm("전체 생성 기록을 삭제하시겠습니까?")) return;
    setHistory([]);
    setSelectedHistoryId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setMode(item.mode);
    setResult(item.data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files);
    const converted = await Promise.all(
      uploadedFiles.map(
        (file) =>
          new Promise<{ data: string; mimeType: string; name: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const data = res.includes(",") ? res.split(",")[1] : res;
              resolve({ data, mimeType: file.type || "image/jpeg", name: file.name });
            };
            reader.readAsDataURL(file);
          })
      )
    );
    setFiles(converted);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          mode,
          amazonLink,
          sourceUrl,
          sourceText,
          media: files,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setResult(data);
      saveToHistory(data, mode);
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2D2926] p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E7E2D9] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">일본 Threads 2030 바이럴 생성기</h1>
            <p className="text-xs md:text-sm text-stone-500 mt-1">저작권 회피 독창적 재창작 · 빈줄 가독성 16종 + 댓글 훅 한일 번역</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="password"
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="pl-9 pr-3 py-2 border border-[#D8D2C4] bg-white rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* 2열 구조 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* 좌측 사이드바: 최근 생성 기록 보관함 */}
          <aside className="lg:col-span-1 bg-[#F6F2EA] border border-[#E3DBD0] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E3DBD0] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <History className="w-4 h-4 text-amber-600" />
                <span>최근 기록 ({history.length})</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-[11px] text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  전체 삭제
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">저장된 기록이 없습니다.</p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => loadHistoryItem(h)}
                    className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedHistoryId === h.id
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm font-semibold"
                        : "bg-white text-stone-700 border-[#DFD8CC] hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{h.title}</p>
                      <span className={`text-[10px] ${selectedHistoryId === h.id ? "text-stone-300" : "text-stone-400"}`}>
                        {h.createdAt}
                      </span>
                    </div>
                    <button
                      onClick={(e) => deleteHistory(h.id, e)}
                      className="hover:text-red-400 text-xs font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* 우측 메인 작업 영역 */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 입력 영역 */}
            <section className="bg-white border border-[#E7E2D9] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center bg-[#F4EFE6] rounded-full p-1 max-w-fit">
                <button
                  onClick={() => setMode("shopping")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    mode === "shopping" ? "bg-stone-900 text-white shadow" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  모드 A: 꿀템/쇼핑
                </button>
                <button
                  onClick={() => setMode("daily")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    mode === "daily" ? "bg-stone-900 text-white shadow" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  모드 B: 일상/공감/힐링
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">캡처 이미지 업로드 (추천)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F4EFE6] file:text-stone-700 hover:file:bg-[#EBE4D8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">아마존 수익화 링크 (선택)</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="https://amzn.to/..."
                      value={amazonLink}
                      onChange={(e) => setAmazonLink(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#D8D2C4] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">소재 텍스트 직접 입력 (선택)</label>
                <textarea
                  rows={2}
                  placeholder="원문 텍스트가 있다면 여기에 직접 입력하세요."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full border border-[#D8D2C4] rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-black text-white font-medium py-3 rounded-xl transition-all shadow disabled:opacity-50 text-xs md:text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    분석 및 16종 독창적 바이럴 카피 생성 중...
                  </>
                ) : (
                  "분석하고 16종 카피 생성하기"
                )}
              </button>
            </section>

            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>}

            {/* 결과 영역 */}
            {result && (
              <div className="space-y-6">
                
                {/* 1. 소재 분석 요약 & 검색어 태그 카드 */}
                <section className="bg-white border border-[#E7E2D9] rounded-2xl p-5 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">소재 분석 요약</h2>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-stone-600">원문 한국어 직역: </span>
                      <p className="mt-1 text-stone-800 bg-[#FAF8F5] p-3 rounded-xl whitespace-pre-wrap leading-relaxed border border-[#EFE9DF]">
                        {result.koreanTranslation}
                      </p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-stone-600">바이럴 핵심 포인트: </span>
                      <ul className="list-disc list-inside mt-1 text-stone-700 space-y-1">
                        {result.viralTriggers?.map((trig, i) => (
                          <li key={i}>{trig}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 샤오홍슈 & 아마존 소싱 검색어 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="bg-[#FAF8F5] border border-[#EFE9DF] p-3.5 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-1.5 font-semibold text-stone-700 text-xs">
                          <Search className="w-3.5 h-3.5 text-rose-500" />
                          <span>샤오홍슈(小红书) 검색용 키워드</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.xiaohongshuKeywords?.map((kw, idx) => (
                            <button
                              key={idx}
                              onClick={() => copyToClipboard(kw, `xhs-${idx}`)}
                              className="text-[11px] bg-white border border-stone-200 px-2.5 py-1 rounded-lg hover:border-rose-300 hover:text-rose-600 transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <span>{kw}</span>
                              {copiedIndex === `xhs-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-stone-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#EFE9DF] p-3.5 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-1.5 font-semibold text-stone-700 text-xs">
                          <Search className="w-3.5 h-3.5 text-amber-600" />
                          <span>일본 아마존(Amazon JP) 검색어</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.amazonKeywords?.map((kw, idx) => (
                            <button
                              key={idx}
                              onClick={() => copyToClipboard(kw, `amz-${idx}`)}
                              className="text-[11px] bg-white border border-stone-200 px-2.5 py-1 rounded-lg hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <span>{kw}</span>
                              {copiedIndex === `amz-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-stone-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 초단문 8종 (본문 + 댓글 링크 훅 한/일 번역) */}
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-stone-900">초단문 카피 8종 (저작권 회피 · 빈 줄 가독성)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.shortCopies?.map((copy, i) => (
                      <div key={i} className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span className="font-bold">SHORT {i + 1}</span>
                            {copy.passed && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">검수 통과</span>}
                          </div>
                          
                          <p className="text-xs text-stone-900 font-medium whitespace-pre-wrap leading-relaxed bg-[#FDFBF7] p-2.5 rounded-lg border border-[#F2EDE4]">
                            {copy.ja}
                          </p>
                          
                          <div className="bg-[#FAF8F5] p-2 rounded text-[11px] text-stone-600 whitespace-pre-wrap border border-[#EFE9DF]">
                            {copy.ko}
                          </div>

                          {copy.commentHook && (
                            <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                                <span className="flex items-center gap-1">
                                  <MessageSquareShare className="w-3 h-3 text-amber-600" />
                                  댓글 링크 훅 (수익화)
                                </span>
                                <button
                                  onClick={() => copyToClipboard(copy.commentHook!, `s-hook-${i}`)}
                                  className="text-[10px] text-amber-800 hover:text-amber-950 underline font-semibold"
                                >
                                  {copiedIndex === `s-hook-${i}` ? "복사됨! ✨" : "댓글 복사"}
                                </button>
                              </div>
                              <p className="text-[11px] text-stone-800 whitespace-pre-wrap leading-snug">
                                {copy.commentHook}
                              </p>
                              {copy.commentHookKo && (
                                <div className="text-[10px] text-amber-800/80 bg-white/70 p-1.5 rounded border border-amber-100">
                                  <span className="font-semibold text-amber-900">[해석]</span> {copy.commentHookKo}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => copyToClipboard(copy.ja, `s-${i}`)}
                          className="w-full border border-stone-800 text-stone-900 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-1.5 mt-2"
                        >
                          {copiedIndex === `s-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedIndex === `s-${i}` ? "본문 복사 완료! ✨" : "일본어 본문 카피 복사"}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. 문단형 8종 (본문 + 댓글 링크 훅 한/일 번역) */}
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-stone-900">문단형 카피 8종 (독창적 앵글 · 감성 스토리)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.paragraphCopies?.map((copy, i) => (
                      <div key={i} className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span className="font-bold">PARAGRAPH {i + 1}</span>
                            {copy.passed && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">검수 통과</span>}
                          </div>

                          <p className="text-xs text-stone-900 font-medium whitespace-pre-wrap leading-relaxed bg-[#FDFBF7] p-2.5 rounded-lg border border-[#F2EDE4]">
                            {copy.ja}
                          </p>

                          <div className="bg-[#FAF8F5] p-2 rounded text-[11px] text-stone-600 whitespace-pre-wrap border border-[#EFE9DF]">
                            {copy.ko}
                          </div>

                          {copy.commentHook && (
                            <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                                <span className="flex items-center gap-1">
                                  <MessageSquareShare className="w-3 h-3 text-amber-600" />
                                  댓글 링크 훅 (수익화)
                                </span>
                                <button
                                  onClick={() => copyToClipboard(copy.commentHook!, `p-hook-${i}`)}
                                  className="text-[10px] text-amber-800 hover:text-amber-950 underline font-semibold"
                                >
                                  {copiedIndex === `p-hook-${i}` ? "복사됨! ✨" : "댓글 복사"}
                                </button>
                              </div>
                              <p className="text-[11px] text-stone-800 whitespace-pre-wrap leading-snug">
                                {copy.commentHook}
                              </p>
                              {copy.commentHookKo && (
                                <div className="text-[10px] text-amber-800/80 bg-white/70 p-1.5 rounded border border-amber-100">
                                  <span className="font-semibold text-amber-900">[해석]</span> {copy.commentHookKo}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => copyToClipboard(copy.ja, `p-${i}`)}
                          className="w-full border border-stone-800 text-stone-900 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-1.5 mt-2"
                        >
                          {copiedIndex === `p-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedIndex === `p-${i}` ? "본문 복사 완료! ✨" : "일본어 본문 카피 복사"}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}