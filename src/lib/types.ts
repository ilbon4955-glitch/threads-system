export type ContentMode = "shopping" | "daily";

export type CopyKind = "short" | "paragraph";

export type ViralCopy = {
  kind: CopyKind;
  ja: string;
  ko: string;
  verification: {
    passed: boolean;
    notes: string[];
  };
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
  copies: ViralCopy[];
  comments: AffiliateComment[];
};

export type MediaPayload = {
  name: string;
  mimeType: string;
  data: string;
};
