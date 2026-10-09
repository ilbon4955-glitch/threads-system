const SUBJECT_PATTERNS = [
  /Áß???Åå?Ç„Çí??/,
  /?è„Åü????Åå?Ç„Çí??/,
  /?Ç„Åü????Åå?Ç„Çí??/,
  /?Ç„Å™????Åå?Ç„Çí??/,
  /Ë≤¥Êñπ[??Åå?Ç„Çí??/,
  /?äÂâç[??Åå?Ç„Çí??/,
];

export function stripHashtags(text: string): string {
  return text.replace(/#[^\s#]+/g, "").replace(/\s{2,}/g, " ").trim();
}

export function stripSubjects(text: string): string {
  let next = text;
  for (const pattern of SUBJECT_PATTERNS) {
    next = next.replace(new RegExp(pattern.source, "g"), "");
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

export function inspectCopy(text: string): string[] {
  const notes: string[] = [];
  if (/#[^\s#]+/.test(text)) notes.push("?¥Ïãú?úÍ∑∏ ?¨Ìï®");
  if (SUBJECT_PATTERNS.some((pattern) => pattern.test(text))) {
    notes.push("Ï£ºÏñ¥(Áß??Ç„Å™?? ?¨Ïö©");
  }
  return notes;
}

export function sanitizeCopy(text: string): string {
  return stripSubjects(stripHashtags(text));
}

export function buildCommentBlock(hook: string, amazonLink: string): string {
  const line = amazonLink.trim() || "https://amzn.to/your-link";
  const hookLine = /?ëá|??.test(hook) ? hook.trim() : `${hook.trim()}?ëá??;
  return [
    hookLine,
    "",
    line,
    line,
    "",
    "?ªAmazon?¢„ÇΩ?∑„Ç®?§„Éà?ó„É≠?∞„É©?†„Å´?ÇÂä†?ó„Å¶?Ñ„Åæ??,
  ].join("\n");
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Î™®Îç∏ ?ëÎãµ?êÏÑú JSON??Ï∞æÏ? Î™ªÌñà?µÎãà??");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

