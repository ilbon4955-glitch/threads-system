import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

function cleanAndFixJson(text: string) {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parsing Error:", e);
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }
}

// 429 Rate Limit 및 503 Overload 지연 재시도 함수
async function generateWithRetry(model: any, contents: any[], retries = 4, delay = 3000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(contents);
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.status === 429 || error.message?.includes("Quota");
      const isOverload = error.message?.includes("503") || error.status === 503;

      if ((isQuotaError || isOverload) && i < retries - 1) {
        console.warn(`[Gemini RateLimit/Overload] Waiting ${delay}ms before retry... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay += 2000; // 429 대비를 위해 지연 시간을 2초씩 넉넉히 증가
      } else {
        throw error;
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, sourceUrl, rawText, mode, userApiKey } = await req.json();

    const activeApiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY || "";

    if (!activeApiKey) {
      return NextResponse.json(
        { error: "Gemini API 키가 입력되지 않았습니다. 상단 입력창에 API 키를 입력해 주세요." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(activeApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.7 
      }
    });

    const buildContents = (systemPrompt: string) => {
      const list: any[] = [systemPrompt];
      if (rawText) list.push(`Raw Text Context: ${rawText}`);
      if (sourceUrl) list.push(`Source URL: ${sourceUrl}`);
      if (mode) list.push(`Mode: ${mode}`);
      if (imageBase64) {
        list.push({
          inlineData: {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: mimeType || "image/jpeg"
          }
        });
      }
      return list;
    };

    // 429 분당 제한을 회피하기 위해 단일 통합 경량 프롬프트 사용
    const unifiedPrompt = `
You are a top-tier Global Threads Viral Marketing Specialist.
Analyze the provided content and generate a viral marketing package for Japanese and US Threads.

CRITICAL INSTRUCTIONS:
1. 'original_translation_ko': Accurate Korean translation of original text/images.
2. 'summary_ko': Concise 2-line Korean explanation on WHY this post went viral.
3. 'viral_factors': 3 core viral hashtags in Korean.
4. JAPANESE COPIES (16 total, 4 personas x 4 copies):
   - Personas: Information_LifeHacks (꿀팁/정보 공유형), Honest_Reviewer (내돈내산/체험형), Trend_FOMO (트렌드/지름 유도형), PainPoint_Solver (문제 해결/비포아프터형)
   - Must use 100% native spoken casual Japanese on Threads/X (〜マジで良き, 〜説, 〜すぎた, 保存必須).
   - EVERY copy MUST have its OWN 1-line native Japanese comment ('comment') and its Korean translation ('comment_ko').
5. ENGLISH COPIES (8 total, 4 personas x 2 copies):
   - Personas: HolyGrail_GameChanger (최애템/삶의질), Honest_HypeCheck (솔직검증/내돈내산), Trend_FOMO (주인공심리/FOMO), PainPoint_Solver (고민파괴)
   - Must use natural US Threads/TikTok slang & hooks (obsessed, game changer, run don't walk).
   - EVERY copy MUST have its OWN 1-line native English comment ('comment') and its Korean translation ('comment_ko').

Return JSON matching EXACTLY this structure:
{
  "product_analysis": {
    "original_translation_ko": "원문 완벽 번역",
    "summary_ko": "바이럴 원인 요약 (2줄)",
    "viral_factors": ["포인트1", "포인트2", "포인트3"]
  },
  "search_keywords": {
    "xiaohongshu": "Xiaohongshu search keyword",
    "amazon_jp": "Amazon JP search keyword",
    "amazon_us": "Amazon US search keyword"
  },
  "japanese_copies": [
    {
      "persona": "Information_LifeHacks",
      "persona_title_ko": "꿀팁/정보 공유형 (높은 저장률)",
      "copies": [
        { "jp": "JP copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "JP copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "JP copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "JP copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Honest_Reviewer",
      "persona_title_ko": "내돈내산/체험형 (높은 신뢰도)",
      "copies": [
        { "jp": "JP copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "JP copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "JP copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "JP copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "트렌드/지름 유도형 (품절대란/참여)",
      "copies": [
        { "jp": "JP copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "JP copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "JP copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "JP copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "문제 해결/비포아프터형 (고민 해결)",
      "copies": [
        { "jp": "JP copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "JP copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "JP copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "JP copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    }
  ],
  "english_copies": [
    {
      "persona": "HolyGrail_GameChanger",
      "persona_title_ko": "최애템/삶의 질 상승형 (Holy Grail)",
      "copies": [
        { "en": "EN copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "EN copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Honest_HypeCheck",
      "persona_title_ko": "솔직검증/내돈내산형 (Honest Review)",
      "copies": [
        { "en": "EN copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "EN copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "주인공 심리/지름 유도형 (Run Don't Walk)",
      "copies": [
        { "en": "EN copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "EN copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "고민 파괴/비포아프터형 (Problem Solver)",
      "copies": [
        { "en": "EN copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "EN copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    }
  ]
}
`;

    const result = await generateWithRetry(model, buildContents(unifiedPrompt));
    const finalResult = cleanAndFixJson(result.response.text());

    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "카피 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}