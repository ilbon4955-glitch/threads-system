'use client';

import { useState, useEffect } from 'react';

interface ScriptItem {
  id: number;
  angle: string;
  copy: string;
  copyKo: string;
  firstComment?: string;
  firstCommentKo?: string;
}

interface GenerationResult {
  historyTitle?: string;
  koreanTranslation?: string;
  viralAnalysis?: string;
  searchKeywords?: {
    xiaohongshu?: string;
    amazonJapan?: string;
    amazonUS?: string;
  };
  japaneseShortCopies?: ScriptItem[];
  japaneseParagraphCopies?: ScriptItem[];
  englishCopies?: ScriptItem[];
}

interface CopyHistoryItem {
  id: string;
  createdAt: string;
  title: string;
  mode: 'A' | 'B';
  inputText: string;
  apiKey: string;
  linkUrl: string;
  fileName: string;
  result: GenerationResult;
}

export default function HomePage() {
  const [apiKey, setApiKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'A' | 'B'>('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const [history, setHistory] = useState<CopyHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('threads_copy_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('히스토리 로드 실패:', e);
      }
    }

    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !linkUrl.trim() && !file) {
      alert('원문 텍스트, 링크, 또는 파일 중 하나 이상을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', inputText);
      formData.append('mode', mode);
      formData.append('apiKey', apiKey);
      formData.append('linkUrl', linkUrl);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data: GenerationResult = await response.json();

      if ((data as any).error) {
        alert(`오류 발생: ${(data as any).error}`);
        return;
      }

      setResult(data);
      setFile(null);

      const newItem: CopyHistoryItem = {
        id: Date.now().toString(),
        createdAt: new Date().toLocaleString('ko-KR'),
        title: data.historyTitle || inputText.slice(0, 20).trim() || '새 생성 항목',
        mode,
        inputText,
        apiKey,
        linkUrl,
        fileName: file ? file.name : '',
        result: data,
      };

      const updated = [newItem, ...history];
      setHistory(updated);
      setSelectedId(newItem.id);
      localStorage.setItem('threads_copy_history', JSON.stringify(updated));
    } catch (err) {
      alert('카피 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: CopyHistoryItem) => {
    setSelectedId(item.id);
    setInputText(item.inputText || '');
    setMode(item.mode);
    setLinkUrl(item.linkUrl || '');
    if (item.apiKey) setApiKey(item.apiKey);
    setResult(item.result);
  };

  const handleNew = () => {
    setSelectedId(null);
    setInputText('');
    setLinkUrl('');
    setFile(null);
    setResult(null);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('threads_copy_history', JSON.stringify(updated));

    if (selectedId === id) {
      handleNew();
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* ================= 좌측 히스토리 사이드바 ================= */}
      <aside className="w-72 border-r border-gray-200 bg-white p-4 flex flex-col h-full shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">생성 히스토리</h2>
          <span className="text-xs text-gray-400">총 {history.length}개</span>
        </div>

        <button
          onClick={handleNew}
          className="w-full mb-4 py-2 px-4 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          + 새로 만들기
        </button>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">저장된 기록이 없습니다.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                className={`p-3 rounded-lg border cursor-pointer text-left transition relative ${
                  selectedId === item.id
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.mode === 'A' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    모드 {item.mode}
                  </span>
                  <button
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                    className="text-xs text-gray-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                <p className="text-[10px] text-gray-400 mt-1">{item.createdAt}</p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ================= 우측 메인 영역 ================= */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-6 max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">글로벌 바이럴 대본 & 분석 생성기</h1>
          <p className="text-sm text-gray-500 mt-1">
            원문, 링크, 이미지 분석 후 검색어 추출 및 일본어 16종 + 영어 8종 대본을 생성합니다.
          </p>
        </header>

        {/* 입력 세팅 */}
        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Gemini API Key를 입력하세요 (자동 저장됨)"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">모드 선택</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('A')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                  mode === 'A' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                모드 A (꿀템 / 쇼핑)
              </button>
              <button
                onClick={() => setMode('B')}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                  mode === 'B' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                모드 B (일상 / 공감 / 힐링 / 유머)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">원문 내용 입력</label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="변환할 원문 내용을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">참고 링크 (선택)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">파일 첨부 (선택)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-1.5 border border-gray-300 rounded-lg text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? '분석 및 대본 생성 중...' : '분석 & 일본어/영어 대본 생성하기'}
          </button>
        </section>

        {/* 생성 결과 표시 영역 */}
        {result && (
          <div className="space-y-8 mb-12">
            {/* 1. 번역 및 바이럴 분석 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.koreanTranslation && (
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2 text-sm">🇰🇷 원문 순수 한국어 번역</h3>
                  <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">
                    {result.koreanTranslation}
                  </p>
                </div>
              )}
              {result.viralAnalysis && (
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-2 text-sm">🔥 이 글이 터진 이유 분석</h3>
                  <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">
                    {result.viralAnalysis}
                  </p>
                </div>
              )}
            </section>

            {/* 2. 소싱 검색어 추천 */}
            {result.searchKeywords && (
              <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">🔍 해외 플랫폼 소싱 검색어</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-red-600">🇨🇳 샤오홍슈 검색어</span>
                      <p className="text-xs font-semibold text-gray-800 mt-1">{result.searchKeywords.xiaohongshu}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(result.searchKeywords?.xiaohongshu || '', 'kw-xhs')}
                      className="w-full py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-semibold rounded transition"
                    >
                      {copiedIndex === 'kw-xhs' ? '✓ 복사완료' : '검색어 복사'}
                    </button>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-orange-600">🇯🇵 일본 아마존 검색어</span>
                      <p className="text-xs font-semibold text-gray-800 mt-1">{result.searchKeywords.amazonJapan}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(result.searchKeywords?.amazonJapan || '', 'kw-amzjp')}
                      className="w-full py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[11px] font-semibold rounded transition"
                    >
                      {copiedIndex === 'kw-amzjp' ? '✓ 복사완료' : '검색어 복사'}
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600">🇺🇸 미국 아마존 검색어</span>
                      <p className="text-xs font-semibold text-gray-800 mt-1">{result.searchKeywords.amazonUS}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(result.searchKeywords?.amazonUS || '', 'kw-amzus')}
                      className="w-full py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[11px] font-semibold rounded transition"
                    >
                      {copiedIndex === 'kw-amzus' ? '✓ 복사완료' : '검색어 복사'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 3. 일본어 대본 (초단문 8종) */}
            {result.japaneseShortCopies && (
              <section>
                <h2 className="text-md font-bold text-gray-800 mb-3">🇯🇵 일본어 초단문 대본 (8종)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.japaneseShortCopies.map((item, idx) => {
                    const fullKey = `jp-short-full-${idx}`;
                    const textKey = `jp-short-text-${idx}`;
                    const commentKey = `jp-short-comment-${idx}`;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                              {item.angle}
                            </span>
                            <button
                              onClick={() => handleCopy(item.copy, textKey)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                            >
                              {copiedIndex === textKey ? '✓ 본문 복사됨' : '본문만 복사'}
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{item.copy}</p>
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">↳ {item.copyKo}</p>

                          {item.firstComment && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs relative">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-gray-400 text-[10px]">💬 첫 댓글 (후킹)</span>
                                <button
                                  onClick={() => handleCopy(item.firstComment || '', commentKey)}
                                  className="text-[10px] text-gray-500 hover:text-black font-semibold underline"
                                >
                                  {copiedIndex === commentKey ? '✓ 댓글 복사됨' : '댓글만 복사'}
                                </button>
                              </div>
                              <p className="text-gray-700">{item.firstComment}</p>
                              <p className="text-gray-400 text-[11px] mt-0.5">↳ {item.firstCommentKo}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(`${item.copy}${item.firstComment ? `\n\n${item.firstComment}` : ''}`, fullKey)}
                          className="w-full py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs font-semibold transition"
                        >
                          {copiedIndex === fullKey ? '✓ 전체 복사완료!' : '전체 복사 (본문 + 댓글)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. 일본어 대본 (문단형 8종) */}
            {result.japaneseParagraphCopies && (
              <section>
                <h2 className="text-md font-bold text-gray-800 mb-3">🇯🇵 일본어 문단형 대본 (8종)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.japaneseParagraphCopies.map((item, idx) => {
                    const fullKey = `jp-para-full-${idx}`;
                    const textKey = `jp-para-text-${idx}`;
                    const commentKey = `jp-para-comment-${idx}`;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">
                              {item.angle}
                            </span>
                            <button
                              onClick={() => handleCopy(item.copy, textKey)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                            >
                              {copiedIndex === textKey ? '✓ 본문 복사됨' : '본문만 복사'}
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{item.copy}</p>
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">↳ {item.copyKo}</p>

                          {item.firstComment && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs relative">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-gray-400 text-[10px]">💬 첫 댓글 (후킹)</span>
                                <button
                                  onClick={() => handleCopy(item.firstComment || '', commentKey)}
                                  className="text-[10px] text-gray-500 hover:text-black font-semibold underline"
                                >
                                  {copiedIndex === commentKey ? '✓ 댓글 복사됨' : '댓글만 복사'}
                                </button>
                              </div>
                              <p className="text-gray-700">{item.firstComment}</p>
                              <p className="text-gray-400 text-[11px] mt-0.5">↳ {item.firstCommentKo}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(`${item.copy}${item.firstComment ? `\n\n${item.firstComment}` : ''}`, fullKey)}
                          className="w-full py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs font-semibold transition"
                        >
                          {copiedIndex === fullKey ? '✓ 전체 복사완료!' : '전체 복사 (본문 + 댓글)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 5. 영어 대본 (8종) */}
            {result.englishCopies && (
              <section>
                <h2 className="text-md font-bold text-gray-800 mb-3">🇺🇸 영어 바이럴 대본 (8종)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.englishCopies.map((item, idx) => {
                    const fullKey = `en-full-${idx}`;
                    const textKey = `en-text-${idx}`;
                    const commentKey = `en-comment-${idx}`;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded">
                              {item.angle}
                            </span>
                            <button
                              onClick={() => handleCopy(item.copy, textKey)}
                              className="text-[11px] text-purple-600 hover:text-purple-800 font-bold underline"
                            >
                              {copiedIndex === textKey ? '✓ 본문 복사됨' : '본문만 복사'}
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{item.copy}</p>
                          <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">↳ {item.copyKo}</p>

                          {item.firstComment && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs relative">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-gray-400 text-[10px]">💬 첫 댓글 (후킹)</span>
                                <button
                                  onClick={() => handleCopy(item.firstComment || '', commentKey)}
                                  className="text-[10px] text-gray-500 hover:text-black font-semibold underline"
                                >
                                  {copiedIndex === commentKey ? '✓ 댓글 복사됨' : '댓글만 복사'}
                                </button>
                              </div>
                              <p className="text-gray-700">{item.firstComment}</p>
                              <p className="text-gray-400 text-[11px] mt-0.5">↳ {item.firstCommentKo}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(`${item.copy}${item.firstComment ? `\n\n${item.firstComment}` : ''}`, fullKey)}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition"
                        >
                          {copiedIndex === fullKey ? '✓ 전체 복사완료!' : '전체 복사 (본문 + 댓글)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}