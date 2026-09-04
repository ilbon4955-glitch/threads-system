'use client';

import React, { useState, useEffect } from 'react';
import { Key, Sparkles, Copy, Check, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface CopyResult {
  ja: string;
  commentHook: string;
  passed?: boolean;
}

interface GenerateResponse {
  paragraphCopies?: CopyResult[];
  error?: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'shopping' | 'lifestyle'>('shopping');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

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
      setImageFile(file);
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
      alert('오른쪽 상단에 Gemini API Key를 입력해 주세요!');
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
          language,
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 헤더 & API Key 입력 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>Threads 2030 바이럴 생성기</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              현지 2030 감성 3~4줄 후킹 카피 및 댓글 링크 훅 자동 생성
            </p>
          </div>

          <div className="flex flex-col gap-1 min-w-[300px]">
            <div className="relative flex items-center">
              <Key className="w-4 h-4 absolute left-3 text-slate-400" />
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

        {/* 설정 및 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          
          {/* 언어 선택 탭 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">생성 언어 선택</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLanguage('ja')}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  language === 'ja' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🇯🇵 일본어 Threads (16종)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🇺🇸 영어 Threads (8종)
              </button>
            </div>
          </div>

          {/* 모드 선택 */}
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

          {/* 이미지 업로드 & 링크 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">캡처 이미지 업로드 (추천)</label>
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
                placeholder="https://amzn.to/... 또는 쿠팡 파트너스 링크"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* 소재 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">소재 텍스트 직접 입력 (선택)</label>
            <textarea
              rows={3}
              placeholder="원문 텍스트나 제품 특성이 있다면 여기에 직접 입력하세요."
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
            {loading ? (
              <span>2030 바이럴 카피 생성 중...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>분석하고 {language === 'ja' ? '16종' : '8종'} 카피 생성하기</span>
              </>
            )}
          </button>
        </form>

        {/* 결과 출력 영역 */}
        {result?.paragraphCopies && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
              <span>생성된 카피 목록 ({result.paragraphCopies.length}개)</span>
              <span className="text-xs font-normal text-slate-500">클릭 시 클립보드로 복사됩니다.</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {result.paragraphCopies.map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        PARAGRAPH {i + 1}
                      </span>
                      {item.passed && (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          검수 통과
                        </span>
                      )}
                    </div>
                    
                    {/* 본문 */}
                    <div className="bg-slate-50 p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap text-slate-800 font-medium">
                      {item.ja}
                    </div>
                  </div>

                  {/* 댓글 훅 카트 */}
                  <div className="space-y-2">
                    <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-amber-800">
                        <span>💬 댓글 링크 훅</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${item.commentHook}\n${affiliateLink || 'https://link.com'}`, `c-${i}`)}
                          className="text-amber-700 hover:underline flex items-center gap-1 text-[10px]"
                        >
                          {copiedIndex === `c-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          댓글 복사
                        </button>
                      </div>
                      <p className="text-slate-700 font-medium">{item.commentHook}</p>
                      {affiliateLink && <p className="text-slate-400 text-[11px] truncate">{affiliateLink}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.ja, `p-${i}`)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedIndex === `p-${i}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>본문 카피 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}