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

// 503 및 과부하 발생 시 최대 5회 자동 재시도 (백그라운드 지연 재시도)
async function generateWithRetry(model: any, contents: any[], retries = 5, delay = 3000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(contents);
    } catch (error: any) {
      const is503 = error.message?.includes("503") || error.status === 503 || error.message?.includes("Service Unavailable");
      const is429 = error.message?.includes("429") || error.status === 429;

      if ((is503 || is429) && i < retries - 1) {
        console.warn(`[Gemini Server Busy] Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay += 1000; // 재시도마다 지연 시간 1초씩 누적 증가
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
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are a top-tier Global Threads Viral Marketing Specialist (1M+ views analyst).
Analyze the provided content (image/text/url) thoroughly and explain WHY this content went viral in Korean.

CRITICAL ANALYSIS INSTRUCTIONS:
1. 'original_translation_ko': Complete and accurate Korean translation of the provided text/image text.
2. 'summary_ko': Detailed Korean analysis explaining WHY this specific post went viral (e.g., visual contrast, relatable psychology, curiosity hook, FOMO trigger, pain point resolution).
3. 'viral_factors': 3 to 4 core viral hashtags in Korean (e.g., ["원색 대비 비주얼", "심리적 공감대", "품절 유도 훅"]).

COPY GENERATION INSTRUCTIONS:
1. JAPANESE COPIES (16 total, 4 Personas x 4 Copies):
   - Persona 1: Information_LifeHacks (꿀팁/정보 공유형 - 높은 저장률)
   - Persona 2: Honest_Reviewer (내돈내산/체험형 - 높은 신뢰도)
   - Persona 3: Trend_FOMO (트렌드/지름 유도형 - 품절대란/참여)
   - Persona 4: PainPoint_Solver (문제 해결/비포아프터형 - 고민 해결)
   - Must use 100% native casual Japanese spoken on Threads/X (e.g., 〜マジで良き, 〜説, 〜すぎた, 保存必須).
   - EVERY copy MUST have its OWN 1-line native Japanese comment ('comment') and its Korean translation ('comment_ko').

2. ENGLISH COPIES (8 total, 4 Personas x 2 Copies):
   - Persona 1: HolyGrail_GameChanger (최애템/삶의 질 상승형 - Holy Grail)
   - Persona 2: Honest_HypeCheck (솔직검증/내돈내산형 - Honest Review)
   - Persona 3: Trend_FOMO (주인공 심리/지름 유도형 - Run Don't Walk)
   - Persona 4: PainPoint_Solver (고민 파괴/비포아프터형 - Problem Solver)
   - Must use natural US Threads/TikTok slang & hooks (e.g., "obsessed", "game changer", "run don't walk", "I thought it was overhyped, but...").
   - EVERY copy MUST have its OWN 1-line native English comment ('comment') and its Korean translation ('comment_ko').

Return JSON in the EXACT structure below:
{
  "product_analysis": {
    "original_translation_ko": "원문 한국어 완벽 번역",
    "summary_ko": "이 글이 왜 바이럴되었는지 심층 분석 (바이럴 원인, 유저 심리, 비주얼 요소 상세 설명)",
    "viral_factors": ["핵심 바이럴 요인 1", "핵심 바이럴 요인 2", "핵심 바이럴 요인 3"]
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
        { "jp": "Native Japanese copy 1", "jp_ko": "한국어 번역 1", "comment": "1-line Japanese comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Native Japanese copy 2", "jp_ko": "한국어 번역 2", "comment": "1-line Japanese comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Native Japanese copy 3", "jp_ko": "한국어 번역 3", "comment": "1-line Japanese comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Native Japanese copy 4", "jp_ko": "한국어 번역 4", "comment": "1-line Japanese comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Honest_Reviewer",
      "persona_title_ko": "내돈내산/체험형 (높은 신뢰도)",
      "copies": [
        { "jp": "Japanese copy 1", "jp_ko": "번역 1", "comment": "comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Japanese copy 2", "jp_ko": "번역 2", "comment": "comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Japanese copy 3", "jp_ko": "번역 3", "comment": "comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Japanese copy 4", "jp_ko": "번역 4", "comment": "comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "트렌드/지름 유도형 (품절대란/참여)",
      "copies": [
        { "jp": "Japanese copy 1", "jp_ko": "번역 1", "comment": "comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Japanese copy 2", "jp_ko": "번역 2", "comment": "comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Japanese copy 3", "jp_ko": "번역 3", "comment": "comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Japanese copy 4", "jp_ko": "번역 4", "comment": "comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "문제 해결/비포아프터형 (고민 해결)",
      "copies": [
        { "jp": "Japanese copy 1", "jp_ko": "번역 1", "comment": "comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Japanese copy 2", "jp_ko": "번역 2", "comment": "comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Japanese copy 3", "jp_ko": "번역 3", "comment": "comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Japanese copy 4", "jp_ko": "번역 4", "comment": "comment 4", "comment_ko": "댓글 번역 4" }
      ]
    }
  ],
  "english_copies": [
    {
      "persona": "HolyGrail_GameChanger",
      "persona_title_ko": "최애템/삶의 질 상승형 (Holy Grail)",
      "copies": [
        { "en": "US English Copy 1", "en_ko": "한국어 번역 1", "comment": "1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US English Copy 2", "en_ko": "한국어 번역 2", "comment": "1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Honest_HypeCheck",
      "persona_title_ko": "솔직검증/내돈내산형 (Honest Review)",
      "copies": [
        { "en": "US English Copy 1", "en_ko": "한국어 번역 1", "comment": "1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US English Copy 2", "en_ko": "한국어 번역 2", "comment": "1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "주인공 심리/지름 유도형 (Run Don't Walk)",
      "copies": [
        { "en": "US English Copy 1", "en_ko": "한국어 번역 1", "comment": "1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US English Copy 2", "en_ko": "한국어 번역 2", "comment": "1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "고민 파괴/비포아프터형 (Problem Solver)",
      "copies": [
        { "en": "US English Copy 1", "en_ko": "한국어 번역 1", "comment": "1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US English Copy 2", "en_ko": "한국어 번역 2", "comment": "1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    }
  ]
}
`;

    const contents: any[] = [prompt];

    if (rawText) contents.push(`Raw Text Context: ${rawText}`);
    if (sourceUrl) contents.push(`Source URL: ${sourceUrl}`);
    if (mode) contents.push(`Mode: ${mode}`);

    if (imageBase64) {
      contents.push({
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: mimeType || "image/jpeg"
        }
      });
    }

    // 5회 자동 재시도 호출 실행
    const result = await generateWithRetry(model, contents);
    const responseText = result.response.text();
    const jsonResult = cleanAndFixJson(responseText);

    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "카피 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}