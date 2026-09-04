import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, prompt, image, mode = 'shopping', affiliateLink } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a world-class viral content analyzer and multi-language Threads marketer.
Analyze the provided image and text, then generate a comprehensive JSON response in KOREAN and target foreign languages.

CRITICAL JSON FORMAT REQUIREMENTS:
Return ONLY valid JSON matching this exact structure:
{
  "originalTranslation": "이미지/소재 텍스트의 정확한 한국어 번역 및 요약",
  "viralAnalysis": "이 게시물/제품이 왜 2030 유저들에게 바이럴되었는지 심리적/시각적 요인 분석 (한국어 2-3줄)",
  "searchKeywords": {
    "xiaohongshu": "샤오홍슈 현지 검색 키워드 (중국어)",
    "amazonJp": "일본 아마존 검색 키워드 (일본어)",
    "amazonUs": "미국 아마존 검색 키워드 (영어)"
  },
  "japaneseCopies": [
    {
      "ja": "3-4 lines of punchy viral copy in Japanese",
      "ko": "해당 일본어 카피의 자연스러운 한국어 번역",
      "commentHook": "short comment hook for affiliate link in Japanese",
      "commentHookKo": "댓글 훅의 한국어 번역"
    }
  ],
  "englishCopies": [
    {
      "en": "3-4 lines of punchy viral copy in English",
      "ko": "해당 영어 카피의 자연스러운 한국어 번역",
      "commentHook": "short comment hook for affiliate link in English",
      "commentHookKo": "댓글 훅의 한국어 번역"
    }
  ]
}

Generate exactly 16 japaneseCopies and 8 englishCopies. Ensure tone fits 2030 viral Trends on Threads.`;

    const promptText = `Category Mode: ${mode}
User Input / Context: ${prompt || 'Analyze image for multi-language viral creation'}
Affiliate Link: ${affiliateLink || 'None'}`;

    const contents: any[] = [{ text: promptText }];

    if (image && typeof image === 'string' && image.includes('base64,')) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const jsonResult = JSON.parse(responseText);

    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || '카피 생성 실패' }, { status: 500 });
  }
}