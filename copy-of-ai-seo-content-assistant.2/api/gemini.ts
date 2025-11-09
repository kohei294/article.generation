
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CompetitorArticle, ArticleDraft, FullArticle, PerformanceAnalysis, SocialMediaPosts, KeywordAnalysisResponse } from '../src/types';

// --- Helper Functions ---
const safeJsonParse = <T,>(jsonString: string): T | null => {
  try {
    const cleanJsonString = jsonString.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanJsonString);
  } catch (error) {
    console.error("Failed to parse JSON:", error, "Raw string:", jsonString);
    return null;
  }
};

const model = "gemini-2.5-flash";

// --- API Logic ---
const analyzeKeywords = async (ai: GoogleGenAI, userUrl: string, competitorUrls: string[]): Promise<KeywordAnalysisResponse | null> => {
    const competitorUrlsText = competitorUrls.map(url => `- ${url}`).join('\n');
    const prompt = `あなたは非常に優秀なSEOキーワード戦略家です。
以下のユーザーサイトと競合サイトのURLを分析し、キーワード戦略をシミュレートしてください。

# 分析対象
- ユーザーサイト: ${userUrl}
- 競合サイト:
${competitorUrlsText}

# タスク
1.  これらのサイトのコンテンツと構造から、ユーザーサイトが狙うべきポテンシャルの高いキーワードを10個特定してください。
2.  各キーワードについて、以下の項目を推定してください：
    -   **searchVolume**: 検索ボリューム（「高」「中」「低」で評価）
    -   **difficulty**: 競合性・難易度（「高」「中」「低」で評価）
    -   **currentRank**: ユーザーサイトの現在の推定順位（数値、またはランク外の場合は「圏外」）
    -   **recommendation**: このキーワードを推奨する理由や戦略的な位置づけ（「主要ターゲット」「ニッチで狙い目」など）
3.  **summary**: 全体的なキーワード戦略と推奨事項の簡単な要約を提供してください。

# 出力形式
必ず以下のJSON形式で、キーも英語で出力してください。説明やMarkdownのバッククオートは不要です。
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keywordAnalysis: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                keyword: { type: Type.STRING },
                                searchVolume: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                currentRank: { type: Type.STRING },
                                recommendation: { type: Type.STRING }
                            },
                            required: ["keyword", "searchVolume", "difficulty", "currentRank", "recommendation"]
                        }
                    },
                    summary: { type: Type.STRING, description: "戦略の要約" }
                },
                required: ["keywordAnalysis", "summary"]
            }
        }
    });

    const result = safeJsonParse<KeywordAnalysisResponse>(response.text || '');
    return (result && result.keywordAnalysis && result.summary) ? result : null;
};


const findTopCompetitorArticles = async (ai: GoogleGenAI, topic: string): Promise<CompetitorArticle[] | null> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: `「${topic}」というトピックで、現在Google検索で上位表示されている競合の記事を5つ特定してください。それぞれの記事について、タイトル、URL、そして記事内容の簡単な要約を提供してください。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "記事のタイトル" },
            url: { type: Type.STRING, description: "記事のURL" },
            summary: { type: Type.STRING, description: "記事の簡単な要約" }
          },
          required: ["title", "url", "summary"]
        }
      }
    }
  });
  const result = safeJsonParse<CompetitorArticle[]>(response.text || '');
  return (result && Array.isArray(result)) ? result : null;
};

const createCompositeArticle = async (ai: GoogleGenAI, topic: string, articles: CompetitorArticle[]): Promise<ArticleDraft | null> => {
    const articleSummaries = articles.map(a => `タイトル: ${a.title}\nURL: ${a.url}\n要約: ${a.summary}`).join('\n\n');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: `以下の競合記事の情報を分析し、これらすべての内容を網羅し、さらにユーザーにとってより価値のある独自の視点を加えた、包括的なSEO記事を作成してください。\n\nメイントピック: ${topic}\n\n競合記事リスト:\n${articleSummaries}\n\n出力として、SEOに強いタイトル、読者を引き込む導入文、そして詳細なセクションごとのアウトライン（見出しと要点）を含む記事のドラフトをJSON形式で生成してください。`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    outline: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "記事のタイトル案" },
                            sections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        heading: { type: Type.STRING, description: "セクションの見出し（H2）" },
                                        points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "そのセクションで触れるべき要点" }
                                    },
                                    required: ["heading", "points"]
                                }
                            }
                        },
                        required: ["title", "sections"]
                    },
                    introduction: { type: Type.STRING, description: "記事の導入部分" }
                },
                required: ["outline", "introduction"]
            }
        }
    });
    const result = safeJsonParse<ArticleDraft>(response.text || '');
    return (result && typeof result === 'object' && !Array.isArray(result) && result.outline) ? result : null;
};

const generateFullArticle = async (ai: GoogleGenAI, draft: ArticleDraft): Promise<FullArticle | null> => {
    const outlineText = draft.outline.sections.map(section => {
        const points = section.points.map(p => `- ${p}`).join('\n');
        return `### ${section.heading}\n${points}`;
    }).join('\n\n');

    const generationPrompt = `
# タスク: 記事執筆
以下の構成案に基づき、高品質で読みやすいSEO記事を執筆してください。
必ず導入、本文、そして結論/まとめのセクションを含めてください。

# 記事ドラフト
## 記事タイトル
${draft.outline.title}
## 導入文
${draft.introduction}
## 記事アウトライン
${outlineText}

# 指示
- PREP法などを意識し、論理的で分かりやすい構成にしてください。
- **記事は読みやすく、理解しやすいように、短い文や箇条書きを効果的に使用してください。専門用語は避け、平易な言葉で説明してください。**
- プロフェッショナルで、読者にとって価値のある文章を心がけてください。
- Markdown形式で、見出しやリストを適切に使用してください。
- **生成する記事の長さは、全体で3000〜5000字程度になるように調整してください。要点を絞り、冗長な説明は避けてください。ただし、内容は必ず完結させてください。**

    const response = await ai.models.generateContent({
        model,
        contents: generationPrompt,
        config: { maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 4096 } },
    });
    return response.text || null;
};

const generateSocialMediaPosts = async (ai: GoogleGenAI, article: FullArticle): Promise<SocialMediaPosts | null> => {
    const prompt = `あなたは非常に優秀なSNSマーケティングの専門家です。以下の記事全体を分析し、読者のエンゲージメントを高め、記事へのクリックを促すような、魅力的で効果的なSNS投稿を作成してください。

# 対象プラットフォーム
- X (旧Twitter): さりげなくアピールするくらいの内容で投稿
- Facebook: Xよりも少し詳しく、共感を呼ぶようなストーリーテリングを意識する。
- LinkedIn: プロフェッショナルな視点から、読者のキャリアやビジネスに役立つ学びがあることを示唆する。

# 共通の指示
- 各プラットフォームの特性に合わせて、トーンと文字数を調整してください。
- 記事の核心的な価値が伝わるように要約してください。
- 読者が「もっと知りたい」「続きを読む」と思えるような、好奇心を刺激する締めくくりにしてください。
- 投稿に最適な、関連性の高いハッシュタグを5〜7個提案してください。

# 元の記事
${article}

# 出力形式
必ず以下のJSON形式で、キーも英語で出力してください。説明やMarkdownのバッククオートは不要です。
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.STRING, description: "X (Twitter)用の投稿文" },
                    facebook: { type: Type.STRING, description: "Facebook用の投稿文" },
                    linkedin: { type: Type.STRING, description: "LinkedIn用の投稿文" },
                    hashtags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "共通して使えるハッシュタグのリスト"
                    }
                },
                required: ["x", "facebook", "linkedin", "hashtags"]
            }
        }
    });
    const result = safeJsonParse<SocialMediaPosts>(response.text || '');
    return (result && result.x && result.facebook && result.linkedin && result.hashtags) ? result : null;
};

const reviseFullArticle = async (ai: GoogleGenAI, currentArticle: FullArticle, revisionPrompt: string): Promise<FullArticle | null> => {
    const prompt = `
あなたはプロの編集者です。以下の記事を、指定された指示に従って完璧に修正してください。
**どのような修正指示であっても、最終的な成果物は必ず「完結した記事」でなければなりません。**

# 元の記事
${currentArticle}

# ユーザーからの修正指示
${revisionPrompt}

# 実行タスク
1.  「ユーザーからの修正指示」を正確に読み取り、それを記事に反映させてください。
2.  元の記事のトーンと論理構造は維持してください。
3.  出力は、修正後の**完全な記事本文のみ**とし、Markdown形式で整形してください。イントロや言い訳は不要です。
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    return response.text || null;
};

const analyzePerformanceData = async (ai: GoogleGenAI, articleUrl: string, socialUrl?: string): Promise<PerformanceAnalysis | null> => {
    const prompt = `
あなたはプロのSEOコンサルタント兼データアナリストです。
提示された記事URL（および任意でSNS投稿URL）に基づき、公開後1ヶ月間のパフォーマンスを現実的にシミュレーションしてください。
あなたはインターネットにアクセスできません。URLのパスや構造から記事のトピックやターゲット読者を推測し、それらしいリアルな分析レポートを生成してください。

# 分析対象
- 記事URL: ${articleUrl}
- SNS投稿URL: ${socialUrl || '指定なし'}

# シミュレーションタスク
以下の項目を含む、包括的なパフォーマンスダッシュボード用のデータを生成してください。

1.  **keyMetrics**: 主要なKPIを予測してください。
    - monthlyPV: 月間PV数 (例: "10,500")
    - users: ユニークユーザー数 (例: "8,200")
    - cvr: コンバージョン率 (例: "1.5%")
    - bounceRate: 直帰率 (例: "45%")
2.  **trafficSources**: 流入経路の割合を予測してください。合計が100%になるようにしてください。
    - source: "自然検索", "ソーシャル", "リファラル", "ダイレクト"など
    - percentage: 数値
3.  **keywordPerformance**: この記事に流入をもたらしていると想定される上位5つのキーワードと、それぞれの推定月間PVを予測してください。
    - keyword: 検索キーワード
    - estimatedPV: 数値
4.  **summary**: データ分析結果の総合的な要約（シミュレーション結果の強み、弱み、機会など）を提供してください。
5.  **actionPlan**: **3ヶ月後**のパフォーマンスをさらに改善するための、具体的で優先順位の高いアクションプランを3つ提案してください。

# 出力形式
分析結果のすべてを、以下のJSON形式で**厳密に**提供してください。
JSONオブジェクト以外（例: \`\`\`json, 説明文）は絶対に出力しないでください。
`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "データ分析結果の総合的な要約" },
                    keyMetrics: {
                        type: Type.OBJECT,
                        properties: {
                            monthlyPV: { type: Type.STRING },
                            users: { type: Type.STRING },
                            cvr: { type: Type.STRING },
                            bounceRate: { type: Type.STRING }
                        },
                        required: ["monthlyPV", "users", "cvr", "bounceRate"]
                    },
                    trafficSources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                source: { type: Type.STRING },
                                percentage: { type: Type.NUMBER }
                            },
                             required: ["source", "percentage"]
                        }
                    },
                    keywordPerformance: {
                        type: Type.ARRAY,
                        items: {
                             type: Type.OBJECT,
                             properties: {
                                 keyword: { type: Type.STRING },
                                 estimatedPV: { type: Type.NUMBER }
                             },
                             required: ["keyword", "estimatedPV"]
                        }
                    },
                    actionPlan: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                action: { type: Type.STRING, description: "具体的な改善アクション" },
                                justification: { type: Type.STRING, description: "そのアクションがなぜ有効かの論理的な根拠" }
                            },
                            required: ["action", "justification"]
                        }
                    }
                },
                required: ["summary", "keyMetrics", "trafficSources", "keywordPerformance", "actionPlan"]
            },
        },
    });
    
    const result = safeJsonParse<PerformanceAnalysis>(response.text || '');
    return (result && result.summary && result.actionPlan) ? result : null;
};


// --- Vercel Serverless Function Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { operation, params } = req.body;

    if (operation === 'verifyPassword') {
        try {
            const appPassword = process.env.APP_PASSWORD;
            if (!appPassword) {
                return res.status(200).json({ data: { success: false } });
            }
            const { password } = params;
            const success = password === appPassword;
            return res.status(200).json({ data: { success } });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error during authentication.' });
        }
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY environment variable not set on the server" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let data;
        switch (operation) {
            case 'analyzeKeywords':
                data = await analyzeKeywords(ai, params.userUrl, params.competitorUrls);
                break;
            case 'findTopCompetitorArticles':
                data = await findTopCompetitorArticles(ai, params.topic);
                break;
            case 'createCompositeArticle':
                data = await createCompositeArticle(ai, params.topic, params.articles);
                break;
            case 'generateFullArticle':
                data = await generateFullArticle(ai, params.draft);
                break;
            case 'generateSocialMediaPosts':
                 data = await generateSocialMediaPosts(ai, params.article);
                break;
            case 'reviseFullArticle':
                data = await reviseFullArticle(ai, params.currentArticle, params.revisionPrompt);
                break;
            case 'analyzePerformanceData':
                data = await analyzePerformanceData(ai, params.articleUrl, params.socialUrl);
                break;
            default:
                return res.status(400).json({ error: 'Invalid operation specified.' });
        }
        res.status(200).json({ data });
    } catch (error) {
        console.error(`Error during operation: ${operation}`, error);
        res.status(500).json({ error: `An internal server error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
}
