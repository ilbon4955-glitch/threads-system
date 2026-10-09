import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Vercel Execution Timeout 설정

// JSON 정제 및 자동 복구 함수
function cleanAndFixJson(text: string): string {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 시작과 끝 중괄호 위치 찾기
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 제어 문자 제거
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });

    return cleaned;
  } catch (e) {
    return text;
  }
}

// 503 과부하 대응 및 모델 자동 Fallback 함수
async function generateContentWithRetry(apiKey: string, contents: any[]) {
  // 우선순위 모델 순서 (3.6-flash -> 2.5-flash -> 2.0-flash)
  const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 2; // 모델당 2회 재시도
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
            // 503 발생 시 1.2초 대기 후 재시도
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
        }
        // 503이 아니거나 재시도 횟수를 다 쓰면 다음 fallback 모델로 전환
        break;
      }
    }
  }

  throw lastError || new Error('구글 제미나이 서버가 과부하 상태입니다. 잠시 후 다시 시도해 주세요.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, images, apiKey: userApiKey } = body;

    // API Key 검증 (클라이언트 전달 키 우선, 없으면 환경변수 사용)
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key가 필요합니다. 상단 입력창에 API Key를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 프롬프트 및 이미지 파싱
    const contents: any[] = [];
    if (prompt) {
      contents.push(prompt);
    }

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

    // 과부하 방지 및 재시도 로직을 탑재한 제미나이 호출
    const rawResponse = await generateContentWithRetry(apiKey, contents);
    
    // JSON 정제
    const cleanedJsonString = cleanAndFixJson(rawResponse);
    const parsedData = JSON.parse(cleanedJsonString);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Generate API Error:', error);
    
    let errorMessage = error?.message || '대본 생성 중 오류가 발생했습니다.';
    if (errorMessage.includes('JSON')) {
      errorMessage = '결과 데이터를 분석하는 중 형식이 다소 흐트러졌습니다. 다시 한 번 [생성] 버튼을 눌러주세요.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}