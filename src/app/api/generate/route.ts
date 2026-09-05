import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // 타임아웃 60초 확대

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
        { error: 'Gemini API Key가 필요합니다.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 출력 길이 최대화 및 최신 모델 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192, // 토큰 잘림 방지
      },
    });

    const systemInstruction = `
      You are an expert social media copywriter.
      Generate viral copies based on user input.

      CRITICAL: You MUST complete the entire JSON response fully without cutting off.

      JSON Structure Required:
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
      Ensure all text fields are concise and strictly complete the JSON.
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

    const result = await model.generateContent(contents);
    const responseText = result.response.text() || '{}';

    let cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let jsonResult;
    try {
      jsonResult = JSON.parse(cleanJsonText);
    } catch (parseError) {
      const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('응답이 중간에 끊겼습니다. 생성 버튼을 다시 한번 눌러주세요.');
      }
    }

    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json(
      { error: error.message || '카피 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}