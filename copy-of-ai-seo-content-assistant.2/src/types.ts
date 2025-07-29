export enum AppStep {
  Preparation = '準備',
  Creation = '作成',
  Analysis = '分析',
}

export interface CompetitorArticle {
  title: string;
  url: string;
  summary: string;
}

export interface KeywordAnalysisResult {
  keyword: string;
  searchVolume: string; // e.g., "High", "Medium", "Low"
  difficulty: string; // e.g., "High", "Medium", "Low"
  currentRank: string; // e.g., "15", "N/A"
  recommendation: string;
}

export interface KeywordAnalysisResponse {
    keywordAnalysis: KeywordAnalysisResult[];
    summary: string;
}


export interface ArticleDraft {
  outline: {
    title: string;
    sections: {
      heading: string;
      points: string[];
    }[];
  };
  introduction: string;
}

export type FullArticle = string;

export interface SocialMediaPosts {
  x: string;
  facebook: string;
  linkedin: string;
  hashtags: string[];
}

export interface PerformanceAnalysis {
  summary: string;
  keyMetrics: {
    monthlyPV: string;
    users: string;
    cvr: string;
    bounceRate: string;
  };
   trafficSources: {
    source: string;
    percentage: number;
  }[];
  keywordPerformance: {
    keyword: string;
    estimatedPV: number;
  }[];
  actionPlan: {
    action: string;
    justification: string;
  }[];
}
