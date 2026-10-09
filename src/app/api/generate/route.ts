import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

function cleanAndFixJson(text: string): string {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });

    return cleaned;
  } catch (e) {
    return text;
  }
}

async function generateContentWithRetry(apiKey: string, contents: any[]) {
  const modelsToTry = ['gemini-2.5-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 2;
    while (retries > 0) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        });

        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        
        if (responseText && responseText.trim().length > 0) {
          return responseText;
        }
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || '';
        const is503 = error?.status === 503 || errorMsg.includes('503') || errorMsg.includes('high demand');

        if (is503) {
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
        }
        break;
      }
    }
  }

  throw lastError || new Error('êµ¬ê? ?œë??˜ì´ ?œë²„ê°€ ê³¼ë????íƒœ?…ë‹ˆ?? ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, images, apiKey: userApiKey } = body;

    const apiKey = (userApiKey && userApiKey.trim() !== '') ? userApiKey.trim() : process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Keyê°€ ?„ìš”?©ë‹ˆ?? ?ë‹¨ ?…ë ¥ì°½ì— API Keyë¥??…ë ¥?´ì£¼?œê±°???œë²„ ?˜ê²½ë³€?˜ë? ?¤ì •?´ì£¼?¸ìš”.' },
        { status: 400 }
      );
    }

    const contents: any[] = [];
    if (prompt) contents.push(prompt);

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.inlineData) {
          contents.push({
            inlineData: {
              data: img.inlineData.data,
              mimeType: img.inlineData.mimeType,
            },
          });
        }
      }
    }

    const rawResponse = await generateContentWithRetry(apiKey, contents);
    const cleanedJsonString = cleanAndFixJson(rawResponse);
    const parsedData = JSON.parse(cleanedJsonString);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Generate API Error:', error);
    let errorMessage = error?.message || '?€ë³??ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
