import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Vercel 타임아웃 60초

// 문장 잘림이나 이스케이프 문제로 인한 깨진 JSON 복구 함수
function cleanAndFixJson(rawText: string) {
  let cleanText = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // JSON 시작점 찾기
  const firstOpenBrace = cleanText.indexOf('{');
  if (firstOpenBrace !== -1) {
    cleanText = cleanText.substring(firstOpenBrace);
  }

  // 1차 시도: 일반 파싱
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // 2차 시도: 제어문자 및 줄바꿈 이스케이프 정제
    try {
      const sanitized = cleanText
        .replace(/[\u0000-\u001F]+/g, ' ')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return JSON.parse(sanitized);
    } catch (e2) {
      // 3차 시도: 끝부분이 잘렸을 경우 괄호 닫아주기 시도
      let lastCloseBrace = cleanText.lastIndexOf('}');
      if (lastCloseBrace !== -1) {
        let truncated = cleanText.substring(0, lastCloseBrace + 1);
        try {
          return JSON.parse(truncated);
        } catch (e3) {
          // 정규식으로 유효한 JSON 객체만 추출
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

    const systemInstruction = `
      You are an expert social media copywriter.
      Generate viral copies based on user input.

      CRITICAL REQUIREMENTS:
      1. You MUST generate valid, parseable JSON without control characters.
      2. Keep responses clean and concise so they do not cut off.

      Required JSON Structure:
      {
        "historyTitle": "제품명/주제 한글 요약 (15자이내)",
        "koreanTranslation": "원문 한국어 번역",
        "viralAnalysis": "바이럴 핵심 포인트 분석 (한국어)",
        "searchKeywords": {
          "xiaohongshu": "샤오홍슈 검색어",
          "amazonJapan": "일본 아마존 검색어",
          "amazonUS": "미국 아마존 검색어"
        },
        "japaneseShortCopies": [
          {"id": 1, "angle": "앵글", "copy": "일본어 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글", "firstCommentKo": "댓글 번역"}
        ],
        "japaneseParagraphCopies": [
          {"id": 1, "angle": "앵글", "copy": "3단 줄바꿈 일본어 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글", "firstCommentKo": "댓글 번역"}
        ],
        "englishCopies": [
          {"id": 1, "angle": "앵글", "copy": "영어 본문", "copyKo": "한국어 번역", "firstComment": "첫댓글", "firstCommentKo": "댓글 번역"}
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

    // 503 및 모델 불응 방지용 후보군
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
    
    // 강건한 JSON 정제 및 파싱 실행
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