export type ContentMode = "shopping" | "daily";

export type JpPersona =
  | "Information_LifeHacks"
  | "Honest_Reviewer"
  | "Trend_FOMO"
  | "PainPoint_Solver";

export type JpCopy = {
  ja: string;
  jp_ko: string;
};

export type EnCopy = {
  en: string;
  en_ko: string;
};

export type AffiliateComment = {
  ja: string;
  ko: string;
};

export type GenerateResult = {
  koreanTranslation: string;
  viralTriggers: string[];
  xiaohongshuKeywords: string[];
  amazonKeywords: string[];
  japanese: Record<JpPersona, JpCopy[]>;
  english: EnCopy[];
  comments: AffiliateComment[];
};

export type MediaPayload = {
  name: string;
  mimeType: string;
  data: string;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  title: string;
  mode: ContentMode;
  result: GenerateResult;
};

export const JP_PERSONAS: { id: JpPersona; label: string }[] = [
  { id: "Information_LifeHacks", label: "꿀???�보 공유" },
  { id: "Honest_Reviewer", label: "?�돈?�산/체험" },
  { id: "Trend_FOMO", label: "?�렌??FOMO" },
  { id: "PainPoint_Solver", label: "문제 ?�결" },
];


