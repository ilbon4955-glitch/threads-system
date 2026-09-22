"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return alert("이미지를 업로드해주세요.");

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: preview,
          mimeType: image?.type || "image/jpeg"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setResult(data);
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Threads 다채널 바이럴 생성기</h1>

      {/* 업로드 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-2">상품 이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm" />
        </div>

        {preview && (
          <div className="w-40 h-40 relative rounded border overflow-hidden">
            <img src={preview} alt="Preview" className="object-cover w-full h-full" />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !preview}
          className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300"
        >
          {loading ? "100만 뷰 바이럴 카피 생성 중..." : "페르소나별 바이럴 카피 16종 생성하기"}
        </button>
      </form>

      {/* 결과 영역 */}
      {result && (
        <div className="space-y-8">
          {/* 제품 분석 */}
          <section className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-2">
            <h2 className="font-bold text-blue-900">🔍 제품 분석 및 바이럴 포인트</h2>
            <p className="text-sm text-gray-700">{result.product_analysis?.summary_ko}</p>
            <div className="flex gap-2 flex-wrap pt-2">
              {result.product_analysis?.viral_factors?.map((v: string, idx: number) => (
                <span key={idx} className="bg-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-full">
                  #{v}
                </span>
              ))}
            </div>
          </section>

          {/* 키워드 복사 */}
          <section className="bg-gray-50 p-5 rounded-xl border space-y-3">
            <h2 className="font-bold text-gray-800">🏷️ 소싱 검색 키워드</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {Object.entries(result.search_keywords || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-center justify-between bg-white p-3 rounded border">
                  <span className="font-semibold uppercase text-xs text-gray-500">{key}:</span>
                  <span className="font-medium text-gray-800 truncate mx-2">{val}</span>
                  <button
                    onClick={() => handleCopy(val, key)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    {copiedIndex === key ? "복사됨!" : "복사"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 일본어 쓰레드 16종 (4 페르소나 x 4개) */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">🇯🇵 일본어 Threads 바이럴 카피 (16종)</h2>
            <div className="grid grid-cols-1 gap-6">
              {result.japanese_copies?.map((group: any, gIdx: number) => (
                <div key={gIdx} className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h3 className="font-bold text-lg text-indigo-600 border-b pb-2">
                    {group.persona_title_ko || group.persona}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.copies?.map((item: any, cIdx: number) => {
                      const copyId = `jp-${gIdx}-${cIdx}`;
                      return (
                        <div key={cIdx} className="bg-gray-50 p-4 rounded-lg border flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">한국어 번역: {item.jp_ko}</p>
                            <p className="whitespace-pre-wrap text-sm text-gray-800 font-medium">{item.jp}</p>
                          </div>
                          <button
                            onClick={() => handleCopy(item.jp, copyId)}
                            className="mt-3 w-full py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800"
                          >
                            {copiedIndex === copyId ? "복사 완료!" : "일본어 카피 복사"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 댓글 (링크 유도 방지) */}
          <section className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
            <h2 className="font-bold text-gray-800">💬 댓글용 자연스러운 실사용 후기</h2>
            <div className="space-y-2">
              {result.comments?.map((c: any, idx: number) => {
                const commentId = `comment-${idx}`;
                return (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded border text-sm">
                    <div>
                      <p className="text-xs text-gray-400">{c.jp_comment_ko}</p>
                      <p className="font-medium text-gray-800">{c.jp_comment}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(c.jp_comment, commentId)}
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded"
                    >
                      {copiedIndex === commentId ? "복사됨" : "복사"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}