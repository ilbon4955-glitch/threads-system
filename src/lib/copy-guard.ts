const SUBJECT_PATTERNS = [
  /私[はがもをの]/,
  /わたし[はがもをの]/,
  /あたし[はがもをの]/,
  /あなた[はがもをの]/,
  /貴方[はがもをの]/,
  /お前[はがもをの]/,
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
  if (/#[^\s#]+/.test(text)) notes.push("해시태그 포함");
  if (SUBJECT_PATTERNS.some((pattern) => pattern.test(text))) {
    notes.push("주어(私/あなた) 사용");
  }
  return notes;
}

export function sanitizeCopy(text: string): string {
  return stripSubjects(stripHashtags(text));
}

export function buildCommentBlock(hook: string, amazonLink: string): string {
  const line = amazonLink.trim() || "https://amzn.to/your-link";
  const hookLine = /👇|✨/.test(hook) ? hook.trim() : `${hook.trim()}👇✨`;
  return [
    hookLine,
    "",
    line,
    line,
    "",
    "※Amazonアソシエイトプログラムに参加しています",
  ].join("\n");
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("모델 응답에서 JSON을 찾지 못했습니다.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
