import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { extractPageFromUrl, formatExtractedPage } from "@/lib/fetch-source";
import type { ContentMode, GenerateResult, JpCopy, JpPersona, MediaPayload } from "@/lib/types";
import { JP_PERSONAS } from "@/lib/types";

export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const LEGAL_NOTICE = "?»Amazon?¢ã‚½?·ã‚¨?¤ãƒˆ?—ãƒ­?°ãƒ©? ã«?‚åŠ ?—ã¦?„ã¾??;

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
  const hookLine = /?‘‡|??.test(hook) ? hook.trim() : `${hook.trim()}?‘‡??;
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
      ? "ëª¨ë“œ A: ê¿€???¼í•‘"
      : "ëª¨ë“œ B: ?¼ìƒ/ê³µê°/?ë§";

  return `?ˆëŠ” ?¼ë³¸ Threads ë°”ì´??ì¹´í”¼?¼ì´?°ë‹¤. ?€ê¹ƒì? ?¼ë³¸ 2030 ?¬ì„±.

[ëª¨ë“œ] ${modeLabel}

[?ˆë? ê·œì¹™]
- koreanTranslation: ?„ë˜ '?¤ì œ ë¶„ì„ ?Œì¬ ?ë¬¸'???ì˜???´ì„ ?†ì´ ?ˆëŠ” ê·¸ë?ë¡?1:1 ì§ì—­?œë‹¤. ?†ëŠ” ?¬ì‹¤??ë³´íƒœì§€ ë§?ê²?
- ?Œì¬ê°€ ë¹„ì–´ ?ˆìœ¼ë©??ìƒ?¼ë¡œ ë³¸ë¬¸??ë§Œë“¤ì§€ ë§ê³ , ?ˆëŠ” ?ìŠ¤?¸ë§Œ ë²ˆì—­Â·ë¶„ì„?œë‹¤.
- ?¼ë³¸??ì¹´í”¼ ë³¸ë¬¸(ja)?ëŠ” ?œêµ­?´Â·ì˜?´ë? ?ì? ë§?ê²? ?œìˆ˜ ?¼ë³¸?´ë§Œ.
- ?§ã™/?¾ã™ ì§ì—­??ê¸ˆì?. ?¤ì œ Threads?ì„œ ?°ì???êµ¬ì–´ì²?ì¤„ì„ë§??…ë§Œ ?¬ìš©:
  ?œãƒ?¸ã§?„ã°??/ ?œèª¬ / ?œä»¶ / ?œã™?ã‚‹ / ?ã£?¡ã‚ƒ / ?“ã‚Œæ²?/ æ­£ç›´ / ç¥?/ ?ã‹??- ì£¼ì–´(ç§??‚ãª?? ë°°ì œ, ?´ì‹œ?œê·¸(#) ê¸ˆì?.
- ?œêµ­??ë²ˆì—­?€ jp_ko / en_ko / koreanTranslation ?„ë“œ?ë§Œ ?£ëŠ”??

[?¼ë³¸??16ì¢????˜ë¥´?Œë‚˜ë³?4ê°œì”©]
1. Information_LifeHacks: ê¿€???•ë³´ ê³µìœ , ?€?¥ë¥ 
2. Honest_Reviewer: ?´ëˆ?´ì‚°/ì²´í—˜, ? ë¢°
3. Trend_FOMO: ?¸ë Œ??ì§€ë¦? ?ˆì ˆÂ·ì°¸ì—¬ ? ë„
4. PainPoint_Solver: ê³ ë? ?´ê²°, ë¹„í¬/? í”„??
ê°??˜ë¥´?Œë‚˜ ë°°ì—´?ëŠ” { "ja", "jp_ko" } ê°ì²´ë¥??•í™•??4ê°?

[?ì–´ 8ì¢?
english ë°°ì—´??{ "en", "en_ko" } 8ê°? ë¯¸êµ­/ê¸€ë¡œë²Œ 2030 ?¬ì„± êµ¬ì–´ì²?

[ê¸°í?]
- viralTriggers: ???°ì¡Œ?”ê? 3ì¤?- xiaohongshuKeywords: å°çº¢ä¹?ê²€?‰ì–´ 6~8ê°?(ì¤‘êµ­??
- amazonKeywords: ?¼ë³¸ ?„ë§ˆì¡?ê²€?‰ì–´ 6~8ê°?(?¼ë³¸??
- comments: 2ì°??„í‚¹ ??ì¤?3ê°? ja?ëŠ” ë§í¬/ê³ ì?ë¥??£ì? ë§?ê²? (?œë²„ê°€ ?„ë§ˆì¡?ë§í¬ 2??+ ${LEGAL_NOTICE} ë¥?ë¶™ì¸??
- ?„ë§ˆì¡?ë§í¬: ${params.amazonLink || "(ë¯¸ì…??"}

JSONë§?ì¶œë ¥:
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

[?¤ì œ ë¶„ì„ ?Œì¬ ?ë¬¸]
?¬ìš©???…ë ¥:
${params.sourceText || "(?†ìŒ)"}

?¹í˜?´ì??ì„œ ì¶”ì¶œ???¤ì œ ë³¸ë¬¸:
${params.extracted || "(URL ?†ìŒ)"}
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

  throw lastError || new Error("êµ¬ê? ?œë??˜ì´ ?œë²„ê°€ ê³¼ë????íƒœ?…ë‹ˆ?? ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??");
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
    const hook = String(row?.ja ?? "æ°—ã«?ªã‚Š?™ã?¦ä¿å­˜ã—??).trim();
    return {
      ja: buildComment(hook, amazonLink),
      ko: String(row?.ko ?? "êµ¬ë§¤ ? ë„??2ì°??„í‚¹ ?“ê?").trim(),
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
            "Gemini API Keyê°€ ?„ìš”?©ë‹ˆ?? ?ë‹¨ ?…ë ¥ì°½ì— API Keyë¥??…ë ¥?˜ê±°???œë²„ ?˜ê²½ë³€?˜ë? ?¤ì •??ì£¼ì„¸??",
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
        { error: "?Œì¬ ?ìŠ¤?? ë§í¬, ?ëŠ” ë¯¸ë””???Œì¼???˜ë‚˜ ?´ìƒ ?£ì–´ ì£¼ì„¸??" },
        { status: 400 },
      );
    }

    const page = await extractPageFromUrl(sourceUrl);
    const extracted = page ? formatExtractedPage(page) : "(URL ?†ìŒ)";
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
      error instanceof Error ? error.message : "?€ë³??ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
