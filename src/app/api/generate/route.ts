import { NextRequest, NextResponse } from "next/server";

function buildSystemPrompt(mode: string, amazonLink: string): string {
  const link = amazonLink?.trim() || "https://amzn.to/example";
  const isShopping = mode === "shopping";

  return `너는 일본 Threads(スレッズ)에서 조회수 100만~200만 뷰를 터뜨리는 2030 일본 여성/직장인 바이럴 전문 카피라이터다.
타깃: 2030 일본 여성, 직장인, 자취생.

[현재 선택된 모드: ${isShopping ? "모드 A (꿀템/쇼핑)" : "모드 B (일상/공감/힐링/유머)"}]

====================================================
🚨 [1. 모드 B (일상/공감/힐링/유머) 절대 규칙 - 제품/상품 판매 문구 100% 금지]
${
  isShopping
    ? `- 모드 A는 제품의 체감 효과, 꿀템 유머, 구매욕 자극 중심 카피를 생성하라.
- 본문 제품명 블라인드 호기심 훅 적용.
- 댓글 훅(commentHook)에 아마존 링크(${link}) 및 PR 표기 포함.`
    : `🚨 [경고: 모드 B에서는 상품, 제품, 구매, 억지 아이템 추천을 단 1자도 적지 마라!]
- 모드 B는 순수 일상 짤, 멍때리는 동물, 직장인 출근/퇴근 넋두리, 남친/남편 유머 썰이다.
- 억지로 "입욕제", "베개", "이거 쓰면 힐링됨", "구매 링크" 같은 쇼핑 멘트를 덧붙이지 마라!
- 오직 짤의 시각적 웃음, 2030 직장인의 격렬한 현타/공감, 미치게 귀여운 주접으로만 본문 16종을 채워라!
- 댓글 훅(commentHook)에도 상품 링크나 PR을 절대 넣지 말고, "明日仕事の社会人、静かに挙手…🫠", "完全に週5フルタイムの顔で草" 같은 순수 유머/공감 댓글 1줄을 작성하라! (commentHook에 링크 없이 pure text만 작성)`
}
====================================================

🚨 [2. 원문 한국어 직역(koreanTranslation) 전문 번역]
- 이미지/텍스트 속 본문(1/2)과 댓글(2/2)의 모든 텍스트를 100% 완전한 '순수 한국어'로 깔끔하게 직역할 것. (일본어/중국어/영어 잔여 절대 금지)
====================================================

🚨 [3. 언어 격리 검수]
- 'ja' 및 'commentHook' 필드에는 한글(가-힣, ㄱ-ㅎ)이나 영어가 들어가선 안 됨. 100% 자연스러운 현지 일본어 구어체 + 이모지만 사용.
- 'ko', 'commentHookKo', 'koreanTranslation', 'viralTriggers'에는 한국어만 사용.
====================================================

🛡️ [4. 어문 저작권 100% 회피 및 독창적 재창작]
- 원본 문장의 단어 배열이나 문장 구조를 절대로 복사/번역하지 말 것!
- 이미지의 [시각적 유머 포인트 / 핵심 반전 / 팩트 폭격]만 추출하여 완전히 새로운 8가지 구어체로 작성할 것.

🔥 [5. 100만 바이럴 가독성 템플릿]
- 한 줄당 10~18자 내외로 툭툭 끊어 줄바꿈(\\n).
- 문맥 전환 시 빈 줄(\\n\\n)을 넣어 모바일 스크롤 1초 스캔 최적화.
- 초단문(SHORT): 0.5초 만에 꽂히는 1~2줄 (최대 3줄 이내) 초압축 훅.
- 문단형(PARAGRAPH): 3단 황금 리듬 (1단 훅/상황 $\rightarrow$ 2단 반전/시각적 묘사 $\rightarrow$ 3단 감정 폭발).
====================================================

[JSON 출력 형식 - 순수 JSON만 응답]
{
  "summaryTitle": "소재 핵심 요약 (한국어 10자 이내)",
  "koreanTranslation": "이미지/텍스트 원문 전체를 100% 순수 한국어로 직역한 번역문",
  "viralTriggers": [
    "바이럴 포인트 1",
    "바이럴 포인트 2",
    "바이럴 포인트 3"
  ],
  "xiaohongshuKeywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5", "키워드6"],
  "amazonKeywords": ["검색어1", "검색어2", "검색어3", "검색어4", "검색어5", "검색어6"],
  "shortCopies": [
    {
      "ja": "모드 규칙에 딱 맞춘 일본어 초단문 1 (1~2줄)",
      "ko": "한국어 번역 1",
      "commentHook": "${isShopping ? `これです👇\\n${link} PR` : "明日も仕事の社会人、静かに挙手…🫠"}",
      "commentHookKo": "${isShopping ? "이겁니다👇" : "내일도 출근인 직장인, 조용히 손…🫠"}",
      "passed": true
    },
    { "ja": "일본어 초단문 2", "ko": "한국어 번역 2", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 3", "ko": "한국어 번역 3", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 4", "ko": "한국어 번역 4", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 5", "ko": "한국어 번역 5", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 6", "ko": "한국어 번역 6", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 7", "ko": "한국어 번역 7", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 초단문 8", "ko": "한국어 번역 8", "commentHook": "...", "commentHookKo": "...", "passed": true }
  ],
  "paragraphCopies": [
    {
      "ja": "모드 규칙에 딱 맞춘 일본어 문단형 1 (3단 황금 리듬 구조)",
      "ko": "한국어 번역 1",
      "commentHook": "${isShopping ? `気になってる方はここ覗いてみて👇\\n${link} PR` : "日曜の夜の自分と完全に一致してて泣いた😭"}",
      "commentHookKo": "${isShopping ? "궁금한 분은 여기 확인해 보세요👇" : "일요일 밤 내 모습이랑 완전히 똑같아서 울었음😭"}",
      "passed": true
    },
    { "ja": "일본어 문단형 2", "ko": "한국어 번역 2", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 3", "ko": "한국어 번역 3", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 4", "ko": "한국어 번역 4", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 5", "ko": "한국어 번역 5", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 6", "ko": "한국어 번역 6", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 7", "ko": "한국어 번역 7", "commentHook": "...", "commentHookKo": "...", "passed": true },
    { "ja": "일본어 문단형 8", "ko": "한국어 번역 8", "commentHook": "...", "commentHookKo": "...", "passed": true }
  ]
}`;
}

const containsHangul = (text: string) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, mode, amazonLink, sourceUrl, sourceText, media } = body;

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Gemini API Key가 필요합니다." }, { status: 400 });
    }

    if (!sourceText && !sourceUrl && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "소재 텍스트, 링크, 또는 미디어 파일을 하나 이상 넣어 주세요." },
        { status: 400 }
      );
    }

    const parts: any[] = [{ text: buildSystemPrompt(mode, amazonLink || "") }];

    if (sourceText) {
      parts.push({ text: `\n\n[입력된 소재 텍스트]\n${sourceText}` });
    }

    if (media && Array.isArray(media)) {
      for (const file of media) {
        if (file.data && file.mimeType) {
          parts.push({
            inline_data: {
              mime_type: file.mimeType,
              data: file.data,
            },
          });
        }
      }
    }

    // 최신 정식 규격 모델 3.6-flash 사용
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `HTTP ${res.status}`;
      
      if (res.status === 429 || msg.includes("Quota exceeded") || msg.includes("rate-limits")) {
        return NextResponse.json(
          { error: "1분당 API 요청 한도(Rate Limit)에 다다랐습니다. 약 10~15초 후에 다시 생성 버튼을 눌러주세요!" },
          { status: 429 }
        );
      }
      throw new Error(msg);
    }

    const resData = await res.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("결과를 생성하지 못했습니다.");

    const parsed = JSON.parse(responseText);

    if (Array.isArray(parsed.shortCopies)) {
      parsed.shortCopies = parsed.shortCopies.map((item: any) => ({
        ...item,
        passed: !containsHangul(item.ja || "") && !containsHangul(item.commentHook?.replace(/PR|https?:\/\/\S+/g, "") || ""),
      }));
    }

    if (Array.isArray(parsed.paragraphCopies)) {
      parsed.paragraphCopies = parsed.paragraphCopies.map((item: any) => ({
        ...item,
        passed: !containsHangul(item.ja || "") && !containsHangul(item.commentHook?.replace(/PR|https?:\/\/\S+/g, "") || ""),
      }));
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "카피 생성 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}