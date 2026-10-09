import * as cheerio from "cheerio";

export type ExtractedPage = {
  url: string;
  title: string;
  description: string;
  bodyText: string;
  error?: string;
};

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "").replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "metadata.google.internal" ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.exec(host);
  if (ipv4) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  return false;
}

function metaContent($: cheerio.CheerioAPI, ...selectors: string[]): string {
  for (const selector of selectors) {
    const value = $(selector).attr("content")?.trim();
    if (value) return value;
  }
  return "";
}

function collectBody($: cheerio.CheerioAPI): string {
  $("script, style, noscript, iframe, svg, nav, footer, header, form").remove();

  const chunks: string[] = [];
  const selector = "p, h1, h2, h3, li, blockquote";
  const scoped = $("article, main, [role='main']");
  const nodes = scoped.length > 0 ? scoped.find(selector) : $(selector);

  nodes.each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length >= 12) chunks.push(text);
  });

  if (chunks.length < 3) {
    $("p").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length >= 12) chunks.push(text);
    });
  }

  const unique = [...new Set(chunks)];
  return unique.join("\n").slice(0, 8000);
}

export async function extractPageFromUrl(rawUrl: string): Promise<ExtractedPage | null> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      url: trimmed,
      title: "",
      description: "",
      bodyText: "",
      error: "유효하지 않은 URL입니다.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      url: trimmed,
      title: "",
      description: "",
      bodyText: "",
      error: "http/https URL만 분석할 수 있습니다.",
    };
  }

  if (isBlockedHost(parsed.hostname)) {
    return {
      url: trimmed,
      title: "",
      description: "",
      bodyText: "",
      error: "내부 주소는 가져올 수 없습니다.",
    };
  }

  try {
    const response = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,ko;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        url: parsed.toString(),
        title: "",
        description: "",
        bodyText: "",
        error: `페이지 응답 오류 (${response.status})`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      metaContent($, "meta[property='og:title']", "meta[name='twitter:title']") ||
      $("title").first().text().trim();

    const description =
      metaContent(
        $,
        "meta[property='og:description']",
        "meta[name='description']",
        "meta[name='twitter:description']",
      );

    const bodyText = collectBody($);

    return {
      url: parsed.toString(),
      title,
      description,
      bodyText,
    };
  } catch {
    return {
      url: parsed.toString(),
      title: "",
      description: "",
      bodyText: "",
      error: "페이지를 가져오지 못했습니다. 텍스트를 함께 붙여넣어 주세요.",
    };
  }
}

export function formatExtractedPage(page: ExtractedPage): string {
  return [
    `URL: ${page.url}`,
    page.error ? `추출 오류: ${page.error}` : "",
    `og:title / title: ${page.title || "(없음)"}`,
    `og:description / description: ${page.description || "(없음)"}`,
    `본문 텍스트:`,
    page.bodyText || "(본문을 추출하지 못함 — 메타 설명만 참고하고 추측으로 내용을 지어내지 말 것)",
  ]
    .filter(Boolean)
    .join("\n");
}
