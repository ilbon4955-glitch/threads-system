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
You are a top-tier Japanese & Global Threads Viral Marketing Specialist who produces 1M+ views posts.
Analyze the provided content (image/text/url context) and generate a viral package for Threads.

CRITICAL RULES:
1. Provide exact Korean translation/summary of original content in 'summary_ko' and 'original_translation_ko'.
2. EVERY copy in 'japanese_copies' MUST have its own 1-line native Japanese comment in 'comment' (and its Korean translation in 'comment_ko').
3. Japanese copies must use 100% native spoken Japanese (e.g., 〜マジで良き, 〜説, 〜すぎた, 保存必須). NO unnatural translated formal Japanese.
4. Comments must be 1-line natural user impressions without any URL or promotional spam triggers.

PERSONA STRUCTURE FOR JAPANESE COPIES (4 Personas x 4 Copies = 16 Total):
[Persona 1: Information_LifeHacks (꿀팁/정보 공유형)]
[Persona 2: Honest_Reviewer (내돈내산/체험형)]
[Persona 3: Trend_FOMO (트렌드/지름 유도형)]
[Persona 4: PainPoint_Solver (문제 해결/비포아프터형)]

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
        {
          "jp": "Pure Native Japanese copy 1",
          "jp_ko": "본문 한국어 번역 1",
          "comment": "Natural 1-line Japanese comment 1",
          "comment_ko": "댓글 한국어 번역 1"
        },
        {
          "jp": "Pure Native Japanese copy 2",
          "jp_ko": "본문 한국어 번역 2",
          "comment": "Natural 1-line Japanese comment 2",
          "comment_ko": "댓글 한국어 번역 2"
        },
        {
          "jp": "Pure Native Japanese copy 3",
          "jp_ko": "본문 한국어 번역 3",
          "comment": "Natural 1-line Japanese comment 3",
          "comment_ko": "댓글 한국어 번역 3"
        },
        {
          "jp": "Pure Native Japanese copy 4",
          "jp_ko": "본문 한국어 번역 4",
          "comment": "Natural 1-line Japanese comment 4",
          "comment_ko": "댓글 한국어 번역 4"
        }
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
      "en": "English Threads Copy 1",
      "en_ko": "본문 한국어 번역 1",
      "comment": "Natural 1-line English comment 1",
      "comment_ko": "댓글 한국어 번역 1"
    },
    { "en": "English Copy 2", "en_ko": "번역 2", "comment": "English Comment 2", "comment_ko": "댓글 번역 2" },
    { "en": "English Copy 3", "en_ko": "번역 3", "comment": "English Comment 3", "comment_ko": "댓글 번역 3" },
    { "en": "English Copy 4", "en_ko": "번역 4", "comment": "English Comment 4", "comment_ko": "댓글 번역 4" },
    { "en": "English Copy 5", "en_ko": "번역 5", "comment": "English Comment 5", "comment_ko": "댓글 번역 5" },
    { "en": "English Copy 6", "en_ko": "번역 6", "comment": "English Comment 6", "comment_ko": "댓글 번역 6" },
    { "en": "English Copy 7", "en_ko": "번역 7", "comment": "English Comment 7", "comment_ko": "댓글 번역 7" },
    { "en": "English Copy 8", "en_ko": "번역 8", "comment": "English Comment 8", "comment_ko": "댓글 번역 8" }
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

    const result = await model.generateContent(contents);
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