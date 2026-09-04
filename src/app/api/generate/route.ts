import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, prompt, image, language = 'ja', mode = 'shopping', affiliateLink } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = language === 'ja'
      ? `You are an expert Threads viral marketer for Japanese 2030 demographics.
Generate output strictly in JSON format as follows:
{
  "paragraphCopies": [
    { "ja": "3-4 lines of punchy copy", "commentHook": "short comment hook for affiliate link", "passed": true }
  ]
}`
      : `You are an expert Threads viral marketer for US 2030 demographics.
Generate output strictly in JSON format as follows:
{
  "paragraphCopies": [
    { "ja": "3-4 lines of punchy copy in English", "commentHook": "short comment hook for affiliate link", "passed": true }
  ]
}`;

    const promptText = `Category Mode: ${mode}
User Input / Context: ${prompt || 'Recommend viral ideas based on image'}
Affiliate Link: ${affiliateLink || 'None'}
Please generate ${language === 'ja' ? '16' : '8'} distinct variations.`;

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