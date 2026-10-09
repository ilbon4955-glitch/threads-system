import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { extractPageFromUrl, formatExtractedPage } from "@/lib/fetch-source";
import type { ContentMode, GenerateResult, JpCopy, JpPersona, MediaPayload } from "@/lib/types";
import { JP_PERSONAS } from "@/lib/types";

export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const LEGAL_NOTICE = "※Amazonアソシエイトプログラムに参加しています";

const PERSONAS: JpPersona[] = JP_PERSONAS.map((item) => item.id);

function cleanAndFixJson(text: string): string {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
    if (match === "\n" || match === "\r" || match === "\t") return match;
    return "";
  });
  return cleaned;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function asJpCopies(value: unknown): JpCopy[] {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({ length: 4 }, (_, index) => {
    const row = rows[index] as { ja?: unknown; jp_ko?: unknown; ko?: unknown } | undefined;
    return {
      ja: String(row?.ja ?? "").trim(),
      jp_ko: String(row?.jp_ko ?? row?.ko ?? "").trim(),
    };
  });
}

function emptyResult(): GenerateResult {
  return {
    koreanTranslation: "",
    viralTriggers: [],
    xiaohongshuKeywords: [],
    amazonKeywords: [],
    japanese: {
      Information_LifeHacks: [],
      Honest_Reviewer: [],
      Trend_FOMO: [],
      PainPoint_Solver: [],
    },
    english: [],
    comments: [],
  };
}

function buildComment(hook: string, amazonLink: string): string {
  const line = amazonLink.trim() || "https://amzn.to/your-link";
  const hookLine = /👇|✨/.test(hook) ? hook.trim() : `${hook.trim()}👇✨`;
  return [hookLine, "", line, line, "", LEGAL_NOTICE].join("\n");
}

function buildPrompt(params: {
  mode: ContentMode;
  sourceText: string;
  extracted: string;
  amazonLink: string;
}): string {
  const modeLabel =
    params.mode === "shopping"
      ? "모드 A: 꿀템/쇼핑"
      : "모드 B: 일상/공감/힐링";

  return `너는 일본 Threads 바이럴 카피라이터다. 타깃은 일본 2030 여성.

[모드] ${modeLabel}

[절대 규칙]
- koreanTranslation: 아래 '실제 분석 소재 원문'을 자의적 해석 없이 있는 그대로 1:1 직역한다. 없는 사실을 보태지 말 것.
- 소재가 비어 있으면 상상으로 본문을 만들지 말고, 있는 텍스트만 번역·분석한다.
- 일본어 카피 본문(ja)에는 한국어·영어를 섞지 말 것. 순수 일본어만.
- です/ます 직역투 금지. 실제 Threads에서 터지는 구어체/줄임말/훅만 사용:
  〜マジでやばい / 〜説 / 〜件 / 〜すぎる / めっちゃ / これ沼 / 正直 / 神 / わかる
- 주어(私/あなた) 배제, 해시태그(#) 금지.
- 한국어 번역은 jp_ko / en_ko / koreanTranslation 필드에만 넣는다.

[일본어 16종 — 페르소나별 4개씩]
1. Information_LifeHacks: 꿀팁/정보 공유, 저장률
2. Honest_Reviewer: 내돈내산/체험, 신뢰
3. Trend_FOMO: 트렌드/지름, 품절·참여 유도
4. PainPoint_Solver: 고민 해결, 비포/애프터

각 페르소나 배열에는 { "ja", "jp_ko" } 객체를 정확히 4개.

[영어 8종]
english 배열에 { "en", "en_ko" } 8개. 미국/글로벌 2030 여성 구어체.

[기타]
- viralTriggers: 왜 터졌는가 3줄
- xiaohongshuKeywords: 小红书 검색어 6~8개 (중국어)
- amazonKeywords: 일본 아마존 검색어 6~8개 (일본어)
- comments: 2차 후킹 한 줄 3개. ja에는 링크/고지를 넣지 말 것. (서버가 아마존 링크 2회 + ${LEGAL_NOTICE} 를 붙인다)
- 아마존 링크: ${params.amazonLink || "(미입력)"}

JSON만 출력:
{
  "koreanTranslation": "",
  "viralTriggers": ["","",""],
  "xiaohongshuKeywords": [],
  "amazonKeywords": [],
  "japanese": {
    "Information_LifeHacks": [{"ja":"","jp_ko":""}],
    "Honest_Reviewer": [{"ja":"","jp_ko":""}],
    "Trend_FOMO": [{"ja":"","jp_ko":""}],
    "PainPoint_Solver": [{"ja":"","jp_ko":""}]
  },
  "english": [{"en":"","en_ko":""}],
  "comments": [{"ja":"","ko":""}]
}

[실제 분석 소재 원문]
사용자 입력:
${params.sourceText || "(없음)"}

웹페이지에서 추출한 실제 본문:
${params.extracted || "(URL 없음)"}
`;
}

type GeminiPart =
  | string
  | {
      inlineData: {
        data: string;
        mimeType: string;
      };
    };

async function generateContentWithRetry(apiKey: string, contents: GeminiPart[]) {
  const modelsToTry = [MODEL, FALLBACK_MODEL];
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown = null;

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
      } catch (error: unknown) {
        lastError = error;
        const err = error as { message?: string; status?: number };
        const errorMsg = err?.message || "";
        const is503 =
          err?.status === 503 || errorMsg.includes("503") || errorMsg.includes("high demand");
        if (is503) {
          retries -= 1;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
        }
        break;
      }
    }
  }

  throw lastError || new Error("구글 제미나이 서버가 과부하 상태입니다. 잠시 후 다시 시도해 주세요.");
}

function normalizeResult(parsed: Record<string, unknown>, amazonLink: string): GenerateResult {
  const result = emptyResult();
  result.koreanTranslation = String(parsed.koreanTranslation ?? "").trim();
  result.viralTriggers = asStringArray(parsed.viralTriggers).slice(0, 3);
  result.xiaohongshuKeywords = asStringArray(parsed.xiaohongshuKeywords);
  result.amazonKeywords = asStringArray(parsed.amazonKeywords);

  const japanese = (parsed.japanese ?? {}) as Record<string, unknown>;
  for (const persona of PERSONAS) {
    result.japanese[persona] = asJpCopies(japanese[persona]);
  }

  const englishRows = Array.isArray(parsed.english) ? parsed.english : [];
  result.english = Array.from({ length: 8 }, (_, index) => {
    const row = englishRows[index] as { en?: unknown; en_ko?: unknown; ko?: unknown } | undefined;
    return {
      en: String(row?.en ?? "").trim(),
      en_ko: String(row?.en_ko ?? row?.ko ?? "").trim(),
    };
  });

  const commentRows = Array.isArray(parsed.comments) ? parsed.comments : [];
  result.comments = Array.from({ length: 3 }, (_, index) => {
    const row = commentRows[index] as { ja?: unknown; ko?: unknown } | undefined;
    const hook = String(row?.ja ?? "気になりすぎて保存した").trim();
    return {
      ja: buildComment(hook, amazonLink),
      ko: String(row?.ko ?? "구매 유도용 2차 후킹 댓글").trim(),
    };
  });

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const userApiKey = String(body.apiKey ?? "").trim();
    const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API Key가 필요합니다. 상단 입력창에 API Key를 입력하거나 서버 환경변수를 설정해 주세요.",
        },
        { status: 400 },
      );
    }

    const sourceText = String(body.sourceText ?? body.prompt ?? "").trim();
    const sourceUrl = String(body.sourceUrl ?? body.refLink ?? "").trim();
    const amazonLink = String(body.amazonLink ?? "").trim();
    const mode: ContentMode = body.mode === "daily" ? "daily" : "shopping";
    const files = Array.isArray(body.files)
      ? (body.files as MediaPayload[])
      : Array.isArray(body.images)
        ? (body.images as MediaPayload[])
        : [];

    if (!sourceText && !sourceUrl && files.length === 0) {
      return NextResponse.json(
        { error: "소재 텍스트, 링크, 또는 미디어 파일을 하나 이상 넣어 주세요." },
        { status: 400 },
      );
    }

    const page = await extractPageFromUrl(sourceUrl);
    const extracted = page ? formatExtractedPage(page) : "(URL 없음)";
    const prompt = buildPrompt({ mode, sourceText, extracted, amazonLink });

    const contents: GeminiPart[] = [prompt];
    for (const file of files) {
      const inline = (file as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
      const data = String(inline?.data ?? file.data ?? "").replace(/^data:[^;]+;base64,/, "");
      const mimeType = String(inline?.mimeType ?? file.mimeType ?? "image/jpeg");
      if (data) {
        contents.push({ inlineData: { data, mimeType } });
      }
    }

    const rawResponse = await generateContentWithRetry(apiKey, contents);
    const parsed = JSON.parse(cleanAndFixJson(rawResponse)) as Record<string, unknown>;
    return NextResponse.json(normalizeResult(parsed, amazonLink));
  } catch (error: unknown) {
    console.error("Generate API Error:", error);
    const message =
      error instanceof Error ? error.message : "대본 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
