import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 한국어 포함 여부 검사 함수
function containsHangul(text: string): boolean {
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}

// 언어별 2030 바이럴 지침 프롬프트 생성 함수
function buildSystemPrompt(language: 'ja' | 'en') {
  if (language === 'en') {
    return `
You are a viral Threads content marketer targeting Gen-Z & Millennials (2030s) in the US/Global market.
Analyze the user's input/image and generate EXACTLY 8 viral copy variations strictly following these rules:

1. Copy Structure (3-4 lines max):
   - Line 1 (Hook/Emotion): High visual impact or dramatic reaction (e.g., "no cause why am I crying over a cup", "ok but nobody talked about this", "brb losing my mind💀").
   - Line 2 (Context/Empathy): Relatable situation or unique product feature using Gen-Z internet slang (e.g., "fr this transformed my room in 2 seconds", "main character energy only").
   - Line 3-4 (Action/CTA): Urgent closing or meme-style call to action (e.g., "adding to cart immediately", "running not walking to get this fr").

2. Tone & Style:
   - Friends DM vibe, natural lowercase, slang (fr, ngl, main character, 😭, 💀, ✨).
   - Never sound like an advertisement. Keep it raw and genuine.

3. Comment Link Template:
   - Provide a natural affiliate/product link comment hook using emojis like 👇👇🐾.

4. Output Format (JSON ONLY):
IMPORTANT: You MUST use the field key "ja" for the main English copy string so that the UI can render it correctly.
Return JSON object:
{
  "paragraphCopies": [
    { "ja": "English main post line 1\\nline 2\\nline 3", "commentHook": "English comment hook line 👇👇🐾" }
  ]
}
Generate exactly 8 variations in paragraphCopies array.
`;
  }

  // 기본값: 일본어 (ja)
  return `
あなたは日本の2030世代（Z世代・ミレニアル世代）をターゲットにしたThreadsのバイラルマーケティングのプロです。
ユーザーの入力・画像を分析し、以下の厳格なルールに従って16種類のコピーを作成してください。

1. 本文構成 (3〜4行制限):
   - 1行目 (フック/感情): 衝撃や共感を呼ぶ一言 (例: 「待って、これ凄すぎて飛んだ🫠」「ちょっと待って、可愛いが渋滞してるんだが…」).
   - 2行目 (状況説明): 2030世代が共感する具体的な使用感やディテール (例: 「ビールの泡が綺麗に立ちすぎて家飲みがバグる」「お部屋のオシャレ度一気に500%アップした」).
   - 3〜4行目 (結論/行動): 売り込み感のない自然な購買意欲刺激 (例: 「売り切れる前にガチで確保して;;」「Qoo10で速攻でカートに入れたわwww」).

2. トーン＆マナー:
   - 友達にLINEやDMを送るようなタメ口・ネットスラング活用 (~すぎ、~なんだが、www、;;、🫠、🥹).
   - 生々しいリアルな口コミ感を維持すること。

3. コメント欄（収益化リンク）誘導テンプレート:
   - 本文にリンクは貼らず、1つ目のコメント欄に誘導する自然な定型文を作成 (例: 🖤 気になる詳細はここからチェック👇👇🐾🐾).

4. 出力フォーマット (JSON ONLY):
必ず以下のJSON形式のみを出力してください:
{
  "paragraphCopies": [
    { "ja": "日本語本文1行目\\n2行目\\n3行目", "commentHook": "コメント欄誘導文👇👇🐾" }
  ]
}
paragraphCopies配列に正確に16個のバリエーションを生成してください。
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, prompt, image, language = 'ja' } = body;

    const userApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!userApiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key가 필요합니다. 오른쪽 상단에 API 키를 입력해주세요.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(userApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemInstruction = buildSystemPrompt(language as 'ja' | 'en');
    const contents: any[] = [systemInstruction];

    if (prompt) {
      contents.push(`소재/상황 설명: ${prompt}`);
    }

    if (image) {
      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0]?.split(':')[1] || 'image/jpeg';
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType,
        },
      });
    }

    const result = await model.generateContent(contents);
    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);

    if (Array.isArray(parsed.paragraphCopies)) {
      parsed.paragraphCopies = parsed.paragraphCopies.map((item: any) => ({
        ...item,
        passed: !containsHangul(item.ja || '') && !containsHangul(item.commentHook?.replace('광고', '') || ''),
      }));
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '카피 생성 도중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}