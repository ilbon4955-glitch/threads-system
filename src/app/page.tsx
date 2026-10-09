'use client';

import React, { useState, useEffect } from 'react';

interface HistoryItem {
  id: string;
  date: string;
  inputPrompt: string;
  result: any;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const [inputText, setInputText] = useState('');
  const [refLink, setRefLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('threads_gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedHistory = localStorage.getItem('threads_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('threads_gemini_api_key', key);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!inputText && !selectedImage) {
      alert('ë³€?˜í•  ?ë¬¸ ?´ìš©?´ë‚˜ ?´ë?ì§€ë¥??…ë ¥?´ì£¼?¸ìš”.');
      return;
    }

    setLoading(true);
    setResultData(null);

    try {
      const promptPayload = `
ëª¨ë“œ: ${activeTab === 'A' ? '?•ë³´ / ê¿€??/ ë¦¬ë·°' : '?¼ìƒ / ê³µê° / ?ë§ / ? ë¨¸'}
?ë¬¸ ?´ìš©: ${inputText}
ì°¸ê³  ë§í¬: ${refLink}

???´ìš©??ë°”íƒ•?¼ë¡œ Threads ë°”ì´???€ë³?24ì¢??¼ì–´ 16ì¢? ?ì–´ 8ì¢? ë°??¤ì›Œ?œë? JSON ?•ì‹?¼ë¡œ ?ì„±?´ì¤˜.
`;

      const imagesPayload = selectedImage
        ? [
            {
              inlineData: {
                data: selectedImage.split(',')[1],
                mimeType: imageMimeType || 'image/png',
              },
            },
          ]
        : [];

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptPayload,
          images: imagesPayload,
          apiKey: apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
      }

      setResultData(data);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('ko-KR'),
        inputPrompt: inputText.substring(0, 30) || '?´ë?ì§€ ë¶„ì„ ?€ë³?,
        result: data,
      };

      const updatedHistory = [newItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      localStorage.setItem('threads_history', JSON.stringify(updatedHistory));
    } catch (error: any) {
      console.error(error);
      alert(error.message || '?”ì²­ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`[${label}] ë³µì‚¬?˜ì—ˆ?µë‹ˆ??`);
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <aside className="w-64 bg-gray-950 p-4 border-r border-gray-800 flex flex-col">
        <h2 className="text-lg font-bold mb-4 text-purple-400">?‘ì—… ?ˆìŠ¤? ë¦¬</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-gray-500">?€?¥ëœ ê¸°ë¡???†ìŠµ?ˆë‹¤.</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => setResultData(item.result)}
                className="w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 truncate transition"
              >
                <div className="font-semibold text-gray-200">{item.inputPrompt}</div>
                <div className="text-[10px] text-gray-500">{item.date}</div>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Threads Viral Lab Â· JP 2030</h1>
            <p className="text-xs text-gray-400 mt-1">ê¸€ë¡œë²Œ ?€ê¹?ë°”ì´???€ë³?ë°??Œì‹± ?¤ì›Œ???ë™ ?ì„±ê¸?/p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-300">?”‘ API Key:</span>
            <input
              type="text"
              placeholder="Gemini API Key (? íƒ/?…ë ¥)"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-purple-500 w-56"
            />
          </div>
        </header>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('A')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              activeTab === 'A' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ëª¨ë“œ A (?í’ˆ / ë°”ì´??/ ?•ë³´ê³µìœ )
          </button>
          <button
            onClick={() => setActiveTab('B')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              activeTab === 'B' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ëª¨ë“œ B (?¼ìƒ / ê³µê° / ?ë§ / ? ë¨¸)
          </button>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 mb-8 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">?ë¬¸ ?´ìš© ?…ë ¥</label>
            <textarea
              rows={4}
              placeholder="ë³€?˜í•  ?ë¬¸ ?´ìš©???…ë ¥?˜ì„¸??.."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ì°¸ê³  ë§í¬ (? íƒ)</label>
              <input
                type="text"
                placeholder="https://..."
                value={refLink}
                onChange={(e) => setRefLink(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">?Œì¼ ì²¨ë? (? íƒ)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-1.5 text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-purple-600 file:text-white"
              />
            </div>
          </div>

          {selectedImage && (
            <div className="mt-2">
              <img src={selectedImage} alt="ë¯¸ë¦¬ë³´ê¸°" className="w-32 h-32 object-cover rounded border border-gray-700" />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-lg transition disabled:opacity-50 text-white"
          >
            {loading ? 'ë¶„ì„ ë°??€ë³??ì„± ì¤?..' : 'ë¶„ì„ ë°??€ë³??ì„± ?œì‘'}
          </button>
        </div>

        {resultData && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-purple-300 border-b border-gray-800 pb-2">?‰ ë°”ì´???€ë³??ì„± ê²°ê³¼</h2>

            {resultData.keywords && (
              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 space-y-2">
                <h3 className="text-sm font-bold text-gray-300">?” ?Œì‹± ë°?ê²€??ì¶”ì²œ ?¤ì›Œ??/h3>
                <div className="flex flex-wrap gap-2">
                  {resultData.keywords.japanese?.map((kw: string, i: number) => (
                    <span key={i} className="bg-purple-900/60 text-purple-200 text-xs px-2.5 py-1 rounded-full border border-purple-700/50">
                      ?‡¯?‡µ {kw}
                    </span>
                  ))}
                  {resultData.keywords.english?.map((kw: string, i: number) => (
                    <span key={i} className="bg-blue-900/60 text-blue-200 text-xs px-2.5 py-1 rounded-full border border-blue-700/50">
                      ?‡º?‡¸ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resultData.scripts && Array.isArray(resultData.scripts) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resultData.scripts.map((script: any, idx: number) => (
                  <div key={idx} className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-900 text-purple-200">
                          #{idx + 1} {script.type || '?€ë³?}
                        </span>
                        <span className="text-xs text-gray-400">{script.lang === 'ja' ? '?‡¯?‡µ ?¼ë³¸?? : '?‡º?‡¸ ?ì–´'}</span>
                      </div>
                      
                      <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed bg-gray-900 p-3 rounded border border-gray-800 mb-3">
                        {script.body || script.content || script.post}
                      </p>

                      {(script.first_comment || script.comment) && (
                        <div className="text-xs text-gray-300 bg-purple-950/40 p-2.5 rounded border border-purple-900/40">
                          <span className="font-bold text-purple-400 block mb-1">?‘‡ ì²??“ê? ?„í‚¹:</span>
                          {script.first_comment || script.comment}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() => copyToClipboard(script.body || script.content || script.post, 'ë³¸ë¬¸')}
                        className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs font-medium rounded transition"
                      >
                        ë³¸ë¬¸ ë³µì‚¬
                      </button>
                      {(script.first_comment || script.comment) && (
                        <button
                          onClick={() => copyToClipboard(script.first_comment || script.comment, '?“ê?')}
                          className="flex-1 py-1.5 bg-purple-800 hover:bg-purple-700 text-xs font-medium rounded transition"
                        >
                          ?“ê? ë³µì‚¬
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(resultData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
