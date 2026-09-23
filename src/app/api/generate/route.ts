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

// 503/429 감지 자동 재시도
async function generateWithRetry(model: any, contents: any[], retries = 3, delay = 1500): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(contents);
    } catch (error: any) {
      const isOverload = error.message?.includes("503") || error.status === 503 || error.message?.includes("429") || error.status === 429;
      if (isOverload && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay += 1000;
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
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
    });

    // 공통 컨텐츠 유틸리티
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

    // 1. 원문 분석 및 키워드 프롬프트
    const promptAnalysis = `
Analyze the provided content and return JSON:
{
  "product_analysis": {
    "original_translation_ko": "Complete Korean translation of the original content/text",
    "summary_ko": "Detailed 2-3 sentence Korean analysis explaining WHY this post went viral (visuals, psychology, hooks)",
    "viral_factors": ["Viral factor 1 in Korean", "Viral factor 2", "Viral factor 3"]
  },
  "search_keywords": {
    "xiaohongshu": "Xiaohongshu search keyword",
    "amazon_jp": "Amazon JP search keyword",
    "amazon_us": "Amazon US search keyword"
  }
}`;

    // 2. 일본어 16종 (4 페르소나 x 4개) 프롬프트
    const promptJapanese = `
Generate 16 native Japanese Threads viral copies based on the provided content.
Rule: 100% native spoken casual Japanese on Threads/X (e.g., 〜マジで良き, 〜説, 〜すぎた, 保存必須).
Structure: 4 Personas x 4 Copies = 16 Total. Each copy MUST have its OWN 1-line native comment ('comment') and Korean translation ('comment_ko').

Return JSON:
{
  "japanese_copies": [
    {
      "persona": "Information_LifeHacks",
      "persona_title_ko": "꿀팁/정보 공유형 (높은 저장률)",
      "copies": [
        { "jp": "Native JP Copy 1", "jp_ko": "한국어 번역 1", "comment": "1-line JP comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Native JP Copy 2", "jp_ko": "한국어 번역 2", "comment": "1-line JP comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Native JP Copy 3", "jp_ko": "한국어 번역 3", "comment": "1-line JP comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Native JP Copy 4", "jp_ko": "한국어 번역 4", "comment": "1-line JP comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Honest_Reviewer",
      "persona_title_ko": "내돈내산/체험형 (높은 신뢰도)",
      "copies": [
        { "jp": "Copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "트렌드/지름 유도형 (품절대란/참여)",
      "copies": [
        { "jp": "Copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "문제 해결/비포아프터형 (고민 해결)",
      "copies": [
        { "jp": "Copy 1", "jp_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "jp": "Copy 2", "jp_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" },
        { "jp": "Copy 3", "jp_ko": "번역 3", "comment": "Comment 3", "comment_ko": "댓글 번역 3" },
        { "jp": "Copy 4", "jp_ko": "번역 4", "comment": "Comment 4", "comment_ko": "댓글 번역 4" }
      ]
    }
  ]
}`;

    // 3. 영어 8종 (4 페르소나 x 2개) 프롬프트
    const promptEnglish = `
Generate 8 viral US English Threads copies based on the provided content.
Rule: Natural US Threads/TikTok slang & hooks (obsessed, game changer, run don't walk).
Structure: 4 Personas x 2 Copies = 8 Total. Each copy MUST have its OWN 1-line native comment ('comment') and Korean translation ('comment_ko').

Return JSON:
{
  "english_copies": [
    {
      "persona": "HolyGrail_GameChanger",
      "persona_title_ko": "최애템/삶의 질 상승형 (Holy Grail)",
      "copies": [
        { "en": "US Copy 1", "en_ko": "한국어 번역 1", "comment": "1-line EN comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US Copy 2", "en_ko": "한국어 번역 2", "comment": "1-line EN comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Honest_HypeCheck",
      "persona_title_ko": "솔직검증/내돈내산형 (Honest Review)",
      "copies": [
        { "en": "US Copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US Copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "Trend_FOMO",
      "persona_title_ko": "주인공 심리/지름 유도형 (Run Don't Walk)",
      "copies": [
        { "en": "US Copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US Copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    },
    {
      "persona": "PainPoint_Solver",
      "persona_title_ko": "고민 파괴/비포아프터형 (Problem Solver)",
      "copies": [
        { "en": "US Copy 1", "en_ko": "번역 1", "comment": "Comment 1", "comment_ko": "댓글 번역 1" },
        { "en": "US Copy 2", "en_ko": "번역 2", "comment": "Comment 2", "comment_ko": "댓글 번역 2" }
      ]
    }
  ]
}`;

    // ★ 핵심: 503 에러 방지를 위해 3개 작업으로 가볍게 분할하여 병렬 실행!
    const [resAnalysis, resJP, resEN] = await Promise.all([
      generateWithRetry(model, buildContents(promptAnalysis)),
      generateWithRetry(model, buildContents(promptJapanese)),
      generateWithRetry(model, buildContents(promptEnglish))
    ]);

    const dataAnalysis = cleanAndFixJson(resAnalysis.response.text());
    const dataJP = cleanAndFixJson(resJP.response.text());
    const dataEN = cleanAndFixJson(resEN.response.text());

    // 결과 하나로 병합
    const finalResult = {
      ...dataAnalysis,
      ...dataJP,
      ...dataEN
    };

    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "카피 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}