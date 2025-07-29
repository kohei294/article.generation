import { CompetitorArticle, ArticleDraft, FullArticle, PerformanceAnalysis, SocialMediaPosts, KeywordAnalysisResponse } from '../types';

async function callApi<T>(operation: string, params: object): Promise<T | null> {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operation, params }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'API request failed with status ' + response.status }));
            console.error(`API Error for ${operation}:`, errorData.error);
            return null;
        }

        const result = await response.json();
        return result.data as T;
    } catch (error) {
        console.error(`Network or parsing error for ${operation}:`, error);
        return null;
    }
}


export const verifyPassword = (password: string): Promise<{ success: boolean } | null> => {
    return callApi('verifyPassword', { password });
};

export const analyzeKeywords = (userUrl: string, competitorUrls: string[]): Promise<KeywordAnalysisResponse | null> => {
    return callApi('analyzeKeywords', { userUrl, competitorUrls });
};

export const findTopCompetitorArticles = (topic: string): Promise<CompetitorArticle[] | null> => {
    return callApi('findTopCompetitorArticles', { topic });
};

export const createCompositeArticle = (topic: string, articles: CompetitorArticle[]): Promise<ArticleDraft | null> => {
    return callApi('createCompositeArticle', { topic, articles });
};

export const generateFullArticle = (draft: ArticleDraft): Promise<FullArticle | null> => {
    return callApi('generateFullArticle', { draft });
};

export const generateSocialMediaPosts = (article: FullArticle): Promise<SocialMediaPosts | null> => {
    return callApi('generateSocialMediaPosts', { article });
};

export const reviseFullArticle = (currentArticle: FullArticle, revisionPrompt: string): Promise<FullArticle | null> => {
    return callApi('reviseFullArticle', { currentArticle, revisionPrompt });
};

export const analyzePerformanceData = (articleUrl: string, socialUrl?: string): Promise<PerformanceAnalysis | null> => {
    return callApi('analyzePerformanceData', { articleUrl, socialUrl });
};
