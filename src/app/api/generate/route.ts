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

// 503 과부하 발생 시 자동 재시도 함수
async function generateWithRetry(model: any, contents: any[], retries = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(contents);
    } catch (error: any) {
      if ((error.message?.includes("503") || error.status === 503) && i < retries - 1) {
        console.warn(`503 Overload occurred. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
You are a top-tier Viral Marketing Specialist for both Japanese and US/Global Threads who produces 1M+ views posts.
Analyze the provided content (image/text/url context) and generate a complete viral package for Threads.

CRITICAL CORE RULES:
1. Provide exact Korean translation/summary of original content in 'original_translation_ko' and 'summary_ko'.
2. ALL Japanese copies (16 total) and ALL English copies (8 total) MUST have their OWN 1-line native user comment in 'comment' (and its Korean translation in 'comment_ko').
3. Japanese copies MUST use 100% native spoken Japanese (〜マジで良き, 〜説, 〜すぎた, 保存必須). NO unnatural translated formal Japanese.
4. English copies MUST use natural, viral US Threads/TikTok style slang & hooks (e.g., "obsessed", "game changer", "run don't walk", "I thought it was overhyped, but...").
5. All comments MUST be 1-line natural user impressions without any URL or promotional spam triggers.

PERSONA STRUCTURE FOR JAPANESE COPIES (4 Personas x 4 Copies = 16 Total):
[Persona 1: Information_LifeHacks (꿀팁/정보 공유형)]
[Persona 2: Honest_Reviewer (내돈내산/체험형)]
[Persona 3: Trend_FOMO (트렌드/지름 유도형)]
[Persona 4: PainPoint_Solver (문제 해결/비포아프터형)]

PERSONA STRUCTURE FOR ENGLISH COPIES (4 Personas x 2 Copies = 8 Total):
[Persona 1: HolyGrail_GameChanger (최애템/삶의 질 상승형 - High Saves)]
[Persona 2: Honest_HypeCheck (솔직검증/내돈내산형 - High Trust)]
[Persona 3: Trend_FOMO (주인공 심리/지름 유도형 - Run don't walk)]
[Persona 4: PainPoint_Solver (고민 파괴/비포아프터형 - Solution)]

Return JSON in the EXACT structure below:
{
  "product_analysis": {
    "original_translation_ko": "원문 한국어 완벽 번역",
    "summary_ko": "핵심 내용 및 바이럴 요인 요약 (한국어)",
    "viral_factors": ["바이럴 포인트 1", "바이럴 포인트 2"]
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
        { "jp": "Pure Native Japanese copy 1", "jp_ko": "한국어 번역 1", "comment": "1-line Japanese comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Pure Native Japanese copy 2", "jp_ko": "한국어 번역 2", "comment": "1-line Japanese comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Pure Native Japanese copy 3", "jp_ko": "한국어 번역 3", "comment": "1-line Japanese comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Pure Native Japanese copy 4", "jp_ko": "한국어 번역 4", "comment": "1-line Japanese comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Honest_Reviewer",
      "persona_title_ko": "내돈내산/체험형 (높은 신뢰도)",
      "copies": [
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "트렌드/지름 유도형 (품절대란/참여)",
      "copies": [
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "문제 해결/비포아프터형 (고민 해결)",
      "copies": [
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" },
        { "jp": "Japanese copy", "jp_ko": "한국어 번역", "comment": "Japanese comment", "comment_ko": "댓글 번역" }
      ]
    }
  ],
  "english_copies": [
    {
      "persona": "HolyGrail_GameChanger",
      "persona_title_ko": "최애템/삶의 질 상승형 (Holy Grail)",
      "copies": [
        { "en": "Viral US English Copy 1", "en_ko": "한국어 번역 1", "comment": "Natural 1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "Viral US English Copy 2", "en_ko": "한국어 번역 2", "comment": "Natural 1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Honest_HypeCheck",
      "persona_title_ko": "솔직검증/내돈내산형 (Honest Review)",
      "copies": [
        { "en": "Viral US English Copy 1", "en_ko": "한국어 번역 1", "comment": "Natural 1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "Viral US English Copy 2", "en_ko": "한국어 번역 2", "comment": "Natural 1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "주인공 심리/지름 유도형 (Run Don't Walk)",
      "copies": [
        { "en": "Viral US English Copy 1", "en_ko": "한국어 번역 1", "comment": "Natural 1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "Viral US English Copy 2", "en_ko": "한국어 번역 2", "comment": "Natural 1-line English comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "고민 파괴/비포아프터형 (Problem Solver)",
      "copies": [
        { "en": "Viral US English Copy 1", "en_ko": "한국어 번역 1", "comment": "Natural 1-line English comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "Viral US English Copy 2", "en_ko": "한국어 번역 2", "comment": "Natural 1-line English comment 2", "comment_ko": "댓글 번역 2" }
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

    // 503 자동 재시도 로직 적용 호출
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