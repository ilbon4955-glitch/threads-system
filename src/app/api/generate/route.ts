import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Vercel 타임아웃 60초

// 문장 잘림이나 이스케이프 문제로 인한 깨진 JSON 복구 함수
function cleanAndFixJson(rawText: string) {
  let cleanText = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstOpenBrace = cleanText.indexOf('{');
  if (firstOpenBrace !== -1) {
    cleanText = cleanText.substring(firstOpenBrace);
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      const sanitized = cleanText
        .replace(/[\u0000-\u001F]+/g, ' ')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return JSON.parse(sanitized);
    } catch (e2) {
      let lastCloseBrace = cleanText.lastIndexOf('}');
      if (lastCloseBrace !== -1) {
        let truncated = cleanText.substring(0, lastCloseBrace + 1);
        try {
          return JSON.parse(truncated);
        } catch (e3) {
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (e4) {
              throw new Error('JSON 구조 정제 실패');
            }
          }
        }
      }
      throw new Error('AI 응답이 완결되지 않았거나 JSON 형식이 올바르지 않습니다.');
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const text = (formData.get('text') as string) || '';
    const mode = (formData.get('mode') as string) || 'A';
    const apiKeyInput = (formData.get('apiKey') as string) || '';
    const linkUrl = (formData.get('linkUrl') as string) || '';
    const file = formData.get('file') as File | null;

    const apiKey = apiKeyInput || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key가 필요합니다. 화면 상단에서 입력해 주세요.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2030 바이럴 쓰레드 최적화 시스템 지침
    const systemInstruction = `
      You are a top-tier Japanese & Global Threads viral copywriter targeting 20s and 30s users.

      CRITICAL STYLE & FORMATTING RULES (Learned from Viral Threads Data):
      1. Short & Readable: 
         - Main body MUST be extremely concise (2 to 3 lines max per post).
         - Use punchy, witty, and relatable tone (e.g., ~じゃなくて, ~らしい, ~すぎる, ~かも, ~はこちら).
      2. Emojis:
         - Insert 1 or 2 high-impact emojis per line (e.g., 🥺🐟, 😆, 🥺💖, 🧼, 👇).
      3. First Comment Hook Rule:
         - Keep it witty, casual, and short with a pointing finger emoji pointing to the link (e.g., "ゴジラの正体これ👇🦖", "ずっと一緒のお魚👇💙", "モデル気分にさせたい子はこちら👇🩷").
      4. Valid JSON Output Only:
         - Ensure clean JSON syntax without unescaped newlines or control characters.

      Required JSON Structure:
      {
        "historyTitle": "제품/주제 한글 요약 (15자이내)",
        "koreanTranslation": "원문 한국어 번역",
        "viralAnalysis": "2030 바이럴 핵심 포인트 분석 (한국어)",
        "searchKeywords": {
          "xiaohongshu": "샤오홍슈 중국어 검색어",
          "amazonJapan": "일본 아마존 일본어 검색어",
          "amazonUS": "미국 아마존 영어 검색어"
        },
        "japaneseShortCopies": [
          {"id": 1, "angle": "앵글명", "copy": "일본어 초단문 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글 후킹 문구", "firstCommentKo": "댓글 번역"}
        ],
        "japaneseParagraphCopies": [
          {"id": 1, "angle": "앵글명", "copy": "일본어 2~3줄 감성/공감 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글 후킹 문구", "firstCommentKo": "댓글 번역"}
        ],
        "englishCopies": [
          {"id": 1, "angle": "앵글명", "copy": "영어 바이럴 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글 후킹 문구", "firstCommentKo": "댓글 번역"}
        ]
      }

      Count Guidelines:
      - japaneseShortCopies: Exactly 8 items
      - japaneseParagraphCopies: Exactly 8 items
      - englishCopies: Exactly 8 items
    `;

    const contents: any[] = [];
    let promptText = `System Instructions:\n${systemInstruction}\n\n[USER INPUT]\n`;
    if (text) promptText += `Text:\n${text}\n\n`;
    if (linkUrl) promptText += `Link:\n${linkUrl}\n\n`;
    promptText += `Mode: ${mode}`;

    contents.push(promptText);

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      contents.push({
        inlineData: {
          mimeType: file.type || 'image/jpeg',
          data: base64Data,
        },
      });
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    let result = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
            },
          });
          result = await model.generateContent(contents);
          if (result) break;
        } catch (err: any) {
          lastError = err;
          if (err.message?.includes('503') || err.status === 503) {
            await new Promise((res) => setTimeout(res, 1200));
            continue;
          }
          break;
        }
      }
      if (result) break;
    }

    if (!result) {
      throw lastError || new Error('AI 서버 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
    }

    const responseText = result.response.text() || '{}';
    const jsonResult = cleanAndFixJson(responseText);

    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json(
      { error: error.message || '카피 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}