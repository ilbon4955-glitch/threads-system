import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    // gemini-3.6-flash 최신 모델 적용
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are a top-tier Japanese Threads Viral Marketing Specialist who produces 1M+ views posts.
Analyze the provided image to generate 16 Japanese Threads copies categorized into 4 distinct personas (4 copies each), 8 English copies, source search keywords, and 1-line user comments.

CRITICAL LANGUAGE & STYLE RULES FOR JAPANESE COPIES:
1. ABSOLUTELY NO Korean, English, or unnatural translated Japanese in Japanese copies.
2. Use 100% native, highly authentic Japanese spoken on Japanese Threads/X (Twitter).
3. DO NOT use formal corporate Japanese like '〜をおすすめします' or '〜です/ます' everywhere. Mix native casual tones ('〜すぎた', '〜マジで良き', '〜正直ビビった', '〜件').
4. Utilize viral hooks, short line breaks, real user reactions, high-engagement words (保存必須, QOL爆上がり, ぶっちゃけ, 正直もっと早く買えばよかった).
5. For each copy, provide its exact Korean translation in a separate field ('jp_ko') purely for UI display.

CRITICAL RULES FOR COMMENTS:
1. Generate 1-line natural user impressions/comments without any URL or promotional spam triggers.

PERSONA STRUCTURE (4 Personas x 4 Copies = 16 Total):

[Persona 1: Information_LifeHacks (꿀팁/정보 공유형 - 높은 저장률)]
- Focus: "I wish I knew this earlier", "God-tier item", high-save value.
- Style: Casual, clear bullet-like line breaks, high usability praise.

[Persona 2: Honest_Reviewer (내돈내산/체험형 - 높은 신뢰도)]
- Focus: "Thought it was just viral hype, but it's legit", honest pros/cons vibe.
- Style: Relatable, real testing tone, high-credibility impression.

[Persona 3: Trend_FOMO (트렌드/지름 유도형 - 품절대란/참여 유도)]
- Focus: "Why is this sold out everywhere?", "Z-generation viral focus".
- Style: Short, punchy, high curiosity hook.

[Persona 4: PainPoint_Solver (문제 해결/비포아프터형 - 고민 해결)]
- Focus: "For those struggling with X, this is the final solution".
- Style: Direct callout to target audience, QOL boost focus.

Return JSON in the EXACT structure below:
{
  "product_analysis": {
    "summary_ko": "이미지 분석 및 원문 요약 (한국어)",
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
        { "jp": "Pure Native Japanese copy 1", "jp_ko": "한국어 번역 1" },
        { "jp": "Pure Native Japanese copy 2", "jp_ko": "한국어 번역 2" },
        { "jp": "Pure Native Japanese copy 3", "jp_ko": "한국어 번역 3" },
        { "jp": "Pure Native Japanese copy 4", "jp_ko": "한국어 번역 4" }
      ]
    },
    {
      "persona": "Honest_Reviewer",
      "persona_title_ko": "내돈내산/체험형 (높은 신뢰도)",
      "copies": [
        { "jp": "Pure Native Japanese copy 1", "jp_ko": "한국어 번역 1" },
        { "jp": "Pure Native Japanese copy 2", "jp_ko": "한국어 번역 2" },
        { "jp": "Pure Native Japanese copy 3", "jp_ko": "한국어 번역 3" },
        { "jp": "Pure Native Japanese copy 4", "jp_ko": "한국어 번역 4" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "트렌드/지름 유도형 (품절대란/참여)",
      "copies": [
        { "jp": "Pure Native Japanese copy 1", "jp_ko": "한국어 번역 1" },
        { "jp": "Pure Native Japanese copy 2", "jp_ko": "한국어 번역 2" },
        { "jp": "Pure Native Japanese copy 3", "jp_ko": "한국어 번역 3" },
        { "jp": "Pure Native Japanese copy 4", "jp_ko": "한국어 번역 4" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "문제 해결/비포아프터형 (고민 해결)",
      "copies": [
        { "jp": "Pure Native Japanese copy 1", "jp_ko": "한국어 번역 1" },
        { "jp": "Pure Native Japanese copy 2", "jp_ko": "한국어 번역 2" },
        { "jp": "Pure Native Japanese copy 3", "jp_ko": "한국어 번역 3" },
        { "jp": "Pure Native Japanese copy 4", "jp_ko": "한국어 번역 4" }
      ]
    }
  ],
  "english_copies": [
    { "en": "English Threads Copy 1", "en_ko": "한국어 번역 1" },
    { "en": "English Threads Copy 2", "en_ko": "한국어 번역 2" },
    { "en": "English Threads Copy 3", "en_ko": "한국어 번역 3" },
    { "en": "English Threads Copy 4", "en_ko": "한국어 번역 4" },
    { "en": "English Threads Copy 5", "en_ko": "한국어 번역 5" },
    { "en": "English Threads Copy 6", "en_ko": "한국어 번역 6" },
    { "en": "English Threads Copy 7", "en_ko": "한국어 번역 7" },
    { "en": "English Threads Copy 8", "en_ko": "한국어 번역 8" }
  ],
  "comments": [
    { "jp_comment": "Natural 1-line Japanese comment 1", "jp_comment_ko": "한국어 번역 1" },
    { "jp_comment": "Natural 1-line Japanese comment 2", "jp_comment_ko": "한국어 번역 2" },
    { "jp_comment": "Natural 1-line Japanese comment 3", "jp_comment_ko": "한국어 번역 3" }
  ]
}
`;

    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: mimeType || "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "카피 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}