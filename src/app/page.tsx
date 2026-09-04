'use client';

import React, { useState, useEffect } from 'react';

interface CopyItem {
  ja?: string;
  en?: string;
  ko: string;
  commentHook: string;
  commentHookKo?: string;
}

interface GenerateResponse {
  originalTranslation?: string;
  viralAnalysis?: string;
  searchKeywords?: {
    xiaohongshu: string;
    amazonJp: string;
    amazonUs: string;
  };
  japaneseCopies?: CopyItem[];
  englishCopies?: CopyItem[];
  error?: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'shopping' | 'lifestyle'>('shopping');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert('Gemini API Key를 입력해 주세요!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          prompt,
          image: imagePreview,
          mode,
          affiliateLink,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성 실패');
      setResult(data);
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>Threads 다채널 바이럴 생성기</span>
              <span>✨</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              캡처 1회 업로드 ➔ 원문 번역 & 바이럴 분석 + 일본어(16종) & 영어(8종) 동시 생성
            </p>
          </div>

          <div className="flex flex-col gap-1 min-w-[300px]">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs">🔑</span>
              <input
                type="password"
                placeholder="Gemini API Key 입력"
                value={apiKey}
                onChange={handleApiKeyChange}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <span className="text-[11px] text-slate-400 text-right">
              Google AI Studio 개인 키 입력 후 사용
            </span>
          </div>
        </header>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">콘텐츠 카테고리</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('shopping')}
                className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                  mode === 'shopping' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                🛍️ 모드 A: 꿀템/쇼핑
              </button>
              <button
                type="button"
                onClick={() => setMode('lifestyle')}
                className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                  mode === 'lifestyle' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                ✨ 모드 B: 일상/공감/힐링
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">캡처 이미지 업로드 (원스톱)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">수익화 링크 (선택)</label>
              <input
                type="url"
                placeholder="https://amzn.to/... 또는 수익화 링크"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">소재 텍스트 직접 입력 (선택)</label>
            <textarea
              rows={3}
              placeholder="원문 텍스트나 제품 특성이 있다면 입력하세요."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2"
          >
            {loading ? '원문 분석 및 일/영 24종 카피 통합 생성 중...' : '🔥 일어 16종 + 영어 8종 한 번에 자동 생성하기'}
          </button>
        </form>

        {/* 분석 및 키워드 섹션 */}
        {result && (
          <div className="space-y-6">
            
            {/* 1. 원문 한국어 번역 & 바이럴 요인 분석 */}
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-3">
              <div>
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">📝 원문 한국어 번역</h3>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">{result.originalTranslation || '원문 분석 완료'}</p>
              </div>
              <div className="border-t border-amber-200/60 pt-3">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">💡 바이럴 요인 분석</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{result.viralAnalysis}</p>
              </div>
            </div>

            {/* 2. 제품 소싱 추천 검색어 (샤오홍슈, 아마존 JP, 아마존 US) */}
            {result.searchKeywords && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">🔍 소싱용 추천 검색어 (복사해서 소싱사이트에 검색)</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  
                  {/* 샤오홍슈 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-red-600 block mb-1">📕 샤오홍슈 (小红书)</span>
                      <p className="text-xs font-medium text-slate-800">{result.searchKeywords.xiaohongshu}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(result.searchKeywords?.xiaohongshu || '', 'kw-xhs')}
                      className="w-full py-1.5 bg-white border border-slate-300 text-[11px] font-semibold rounded-lg hover:bg-slate-100"
                    >
                      {copiedId === 'kw-xhs' ? '✓ 복사완료' : '📋 키워드 복사'}
                    </button>
                  </div>

                  {/* 일본 아마존 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-amber-600 block mb-1">🇯🇵 아마존 재팬</span>
                      <p className="text-xs font-medium text-slate-800">{result.searchKeywords.amazonJp}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(result.searchKeywords?.amazonJp || '', 'kw-amzjp')}
                      className="w-full py-1.5 bg-white border border-slate-300 text-[11px] font-semibold rounded-lg hover:bg-slate-100"
                    >
                      {copiedId === 'kw-amzjp' ? '✓ 복사완료' : '📋 키워드 복사'}
                    </button>
                  </div>

                  {/* 미국 아마존 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 block mb-1">🇺🇸 아마존 US</span>
                      <p className="text-xs font-medium text-slate-800">{result.searchKeywords.amazonUs}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(result.searchKeywords?.amazonUs || '', 'kw-amzus')}
                      className="w-full py-1.5 bg-white border border-slate-300 text-[11px] font-semibold rounded-lg hover:bg-slate-100"
                    >
                      {copiedId === 'kw-amzus' ? '✓ 복사완료' : '📋 키워드 복사'}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* 3. 일본어 Threads 카피 목록 (16종) */}
            {result.japaneseCopies && (
              <section className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b pb-2">
                  <span>🇯🇵 일본어 Threads 카피 (16종)</span>
                  <span className="text-xs text-slate-500 font-normal">한국어 번역 제공</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.japaneseCopies.map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">JA PARAGRAPH {i + 1}</span>
                        {/* 일본어 본문 */}
                        <div className="bg-slate-50 p-3 rounded-xl text-xs leading-relaxed font-medium whitespace-pre-wrap text-slate-800">
                          {item.ja}
                        </div>
                        {/* 한국어 해석 */}
                        <div className="bg-amber-50/50 p-2.5 rounded-lg text-[11px] text-slate-600 border border-amber-100">
                          <span className="font-bold text-amber-800">[해석] </span>{item.ko}
                        </div>
                      </div>

                      {/* 댓글 훅 & 복사 */}
                      <div className="space-y-2">
                        <div className="p-2.5 bg-slate-100/70 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                            <span>💬 댓글 링크 훅</span>
                            <button
                              type="button"
                              onClick={() => copyText(`${item.commentHook}\n${affiliateLink || ''}`, `ja-c-${i}`)}
                              className="text-slate-800 hover:underline font-bold text-[10px]"
                            >
                              {copiedId === `ja-c-${i}` ? '✓ 완료' : '📋 댓글 복사'}
                            </button>
                          </div>
                          <p className="text-slate-800 font-medium">{item.commentHook}</p>
                          <p className="text-slate-400 text-[10px]">[해석] {item.commentHookKo}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyText(item.ja || '', `ja-p-${i}`)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-all"
                        >
                          {copiedId === `ja-p-${i}` ? '✓ 일본어 본문 복사 완료!' : '📋 일본어 본문 카피 복사'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. 영어 Threads 카피 목록 (8종) */}
            {result.englishCopies && (
              <section className="space-y-4 pt-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b pb-2">
                  <span>🇺🇸 영어 Threads 카피 (8종)</span>
                  <span className="text-xs text-slate-500 font-normal">한국어 번역 제공</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.englishCopies.map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">EN PARAGRAPH {i + 1}</span>
                        {/* 영어 본문 */}
                        <div className="bg-slate-50 p-3 rounded-xl text-xs leading-relaxed font-medium whitespace-pre-wrap text-slate-800">
                          {item.en}
                        </div>
                        {/* 한국어 해석 */}
                        <div className="bg-amber-50/50 p-2.5 rounded-lg text-[11px] text-slate-600 border border-amber-100">
                          <span className="font-bold text-amber-800">[해석] </span>{item.ko}
                        </div>
                      </div>

                      {/* 댓글 훅 & 복사 */}
                      <div className="space-y-2">
                        <div className="p-2.5 bg-slate-100/70 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                            <span>💬 댓글 링크 훅</span>
                            <button
                              type="button"
                              onClick={() => copyText(`${item.commentHook}\n${affiliateLink || ''}`, `en-c-${i}`)}
                              className="text-slate-800 hover:underline font-bold text-[10px]"
                            >
                              {copiedId === `en-c-${i}` ? '✓ 완료' : '📋 댓글 복사'}
                            </button>
                          </div>
                          <p className="text-slate-800 font-medium">{item.commentHook}</p>
                          <p className="text-slate-400 text-[10px]">[해석] {item.commentHookKo}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyText(item.en || '', `en-p-${i}`)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-all"
                        >
                          {copiedId === `en-p-${i}` ? '✓ 영어 본문 복사 완료!' : '📋 영어 본문 카피 복사'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </main>
  );
}