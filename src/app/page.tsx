"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("mode_a");
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"jp" | "en">("jp");

  // 이미지 업로드 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 복사 처리 (클릭 시 꺼짐 방지)
  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 생성 요청 (폼 제출 시 튕김 방지 e.preventDefault 적용)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview && !rawText && !sourceUrl) {
      return alert("원문, 링크, 또는 이미지 중 하나 이상을 입력해주세요.");
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: preview || "",
          mimeType: image?.type || "image/jpeg",
          rawText,
          sourceUrl,
          mode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");

      setResult(data);
      setHistory((prev) => [
        {
          id: Date.now(),
          title: data.product_analysis?.summary_ko || "생성 결과",
          data
        },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 1. 좌측 히스토리 패널 */}
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col border-r border-gray-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          📜 작업 히스토리
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-gray-500">생성된 기록이 없습니다.</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => setResult(item.data)}
                className="w-full text-left p-2.5 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 truncate"
              >
                {item.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 2. 중앙 메인 컨텐츠 영역 */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              글로벌 바이럴 생성기 (Threads Viral Lab)
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              원문, 링크, 이미지 분석 기반 4가지 페르소나 바이럴 대본 자동 생성
            </p>
          </header>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            {/* 모드 선택 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("mode_a")}
                className={`py-2 px-4 text-xs font-semibold rounded-lg border ${
                  mode === "mode_a"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                모드 A (상품 / 바이럴 / 정보공유)
              </button>
              <button
                type="button"
                onClick={() => setMode("mode_b")}
                className={`py-2 px-4 text-xs font-semibold rounded-lg border ${
                  mode === "mode_b"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                모드 B (일상 / 공감 / 힐링 / 유머)
              </button>
            </div>

            {/* 원문 입력 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">원문 내용 입력</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="변환할 원문 내용을 입력하세요..."
                className="w-full h-20 p-3 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* 링크 및 파일 첨부 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">참고 링크 (선택)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">파일 첨부 (선택)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs"
                />
              </div>
            </div>

            {preview && (
              <div className="w-24 h-24 relative rounded border overflow-hidden">
                <img src={preview} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg disabled:bg-gray-300"
            >
              {loading ? "분석 및 대본 생성 중..." : "분석 및 대본 생성 시작"}
            </button>
          </form>

          {/* 결과 영역 */}
          {result && (
            <div className="space-y-6">
              {/* 요약 및 바이럴 요인 */}
              <section className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-2">
                <h2 className="font-bold text-sm text-blue-900">🔍 원문 요약 및 바이럴 분석</h2>
                <p className="text-xs text-gray-700">{result.product_analysis?.summary_ko}</p>
                <div className="flex gap-2 flex-wrap pt-1">
                  {result.product_analysis?.viral_factors?.map((v: string, idx: number) => (
                    <span key={idx} className="bg-blue-200 text-blue-800 text-[11px] px-2 py-0.5 rounded-full">
                      #{v}
                    </span>
                  ))}
                </div>
              </section>

              {/* 검색 키워드 */}
              <section className="bg-gray-50 p-4 rounded-xl border space-y-2">
                <h2 className="font-bold text-xs text-gray-800">🏷️ 소싱 검색 키워드</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.entries(result.search_keywords || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between bg-white p-2 rounded border text-xs">
                      <span className="font-bold uppercase text-gray-400">{key}:</span>
                      <span className="truncate mx-1 text-gray-800 font-medium">{val}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, val, key)}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        {copiedId === key ? "복사됨" : "복사"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* 언어 선택 탭 */}
              <div className="flex border-b border-gray-200 space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("jp")}
                  className={`pb-2 text-sm font-bold border-b-2 ${
                    activeTab === "jp"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  🇯🇵 일본어 Threads (16종 - 4개 페르소나)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("en")}
                  className={`pb-2 text-sm font-bold border-b-2 ${
                    activeTab === "en"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  🇺🇸 영어 Threads (8종)
                </button>
              </div>

              {/* 일본어 16종 (4 페르소나) */}
              {activeTab === "jp" && (
                <div className="space-y-6">
                  {result.japanese_copies?.map((group: any, gIdx: number) => (
                    <div key={gIdx} className="bg-white p-5 rounded-xl border space-y-3">
                      <h3 className="font-bold text-sm text-indigo-600 border-b pb-2">
                        {group.persona_title_ko || group.persona}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.copies?.map((item: any, cIdx: number) => {
                          const id = `jp-${gIdx}-${cIdx}`;
                          return (
                            <div key={cIdx} className="bg-gray-50 p-3 rounded-lg border flex flex-col justify-between">
                              <div>
                                <p className="text-[11px] text-gray-400 mb-1">해석: {item.jp_ko}</p>
                                <p className="whitespace-pre-wrap text-xs text-gray-800 font-medium">{item.jp}</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(e, item.jp, id)}
                                className="mt-3 w-full py-1 text-xs bg-black text-white rounded hover:bg-gray-800"
                              >
                                {copiedId === id ? "복사 완료!" : "카피 복사"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 영어 8종 */}
              {activeTab === "en" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.english_copies?.map((item: any, idx: number) => {
                    const id = `en-${idx}`;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-[11px] text-gray-400 mb-1">해석: {item.en_ko}</p>
                          <p className="whitespace-pre-wrap text-xs text-gray-800 font-medium">{item.en}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, item.en, id)}
                          className="w-full py-1 text-xs bg-black text-white rounded hover:bg-gray-800"
                        >
                          {copiedId === id ? "복사 완료!" : "카피 복사"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 댓글 섹션 */}
              <section className="bg-white p-5 rounded-xl border space-y-3">
                <h2 className="font-bold text-xs text-gray-800">💬 댓글용 자연스러운 실사용 후기</h2>
                <div className="space-y-2">
                  {result.comments?.map((c: any, idx: number) => {
                    const id = `comment-${idx}`;
                    return (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded border text-xs">
                        <div>
                          <p className="text-[10px] text-gray-400">{c.jp_comment_ko}</p>
                          <p className="font-medium text-gray-800">{c.jp_comment}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, c.jp_comment, id)}
                          className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        >
                          {copiedId === id ? "복사됨" : "복사"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}