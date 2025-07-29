import React, { useState, useCallback } from 'react';
import { CompetitorArticle, ArticleDraft, KeywordAnalysisResponse } from '../../types';
import { findTopCompetitorArticles, createCompositeArticle, analyzeKeywords } from '../../services/geminiService';
import { SearchIcon, PencilSquareIcon, SparklesIcon, InformationCircleIcon } from '../icons';
import Tooltip from '../Tooltip';

interface PreparationStepProps {
    onDraftCreated: (draft: ArticleDraft) => void;
}

type Stage = 'idle' | 'analyzingKeywords' | 'findingArticles' | 'creatingDraft';

const LoadingIndicator: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center space-x-2 text-blue-600 my-4">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{text}</span>
    </div>
);

export default function PreparationStep({ onDraftCreated }: PreparationStepProps) {
    const [stage, setStage] = useState<Stage>('idle');
    const [error, setError] = useState<string | null>(null);
    
    // Keyword analysis state
    const [userUrl, setUserUrl] = useState('');
    const [competitorUrl1, setCompetitorUrl1] = useState('');
    const [competitorUrl2, setCompetitorUrl2] = useState('');
    const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysisResponse | null>(null);

    // Article generation state
    const [topic, setTopic] = useState('');
    const [competitorArticles, setCompetitorArticles] = useState<CompetitorArticle[] | null>(null);

    const handleAnalyzeKeywords = useCallback(async () => {
        if (!userUrl.trim()) {
            setError('自社サイトのURLを入力してください。');
            return;
        }
        setError(null);
        setStage('analyzingKeywords');
        setKeywordAnalysis(null);
        try {
            const competitorUrls = [competitorUrl1, competitorUrl2].filter(url => url.trim() !== '');
            const result = await analyzeKeywords(userUrl, competitorUrls);
            if (result && result.keywordAnalysis) {
                setKeywordAnalysis(result);
            } else {
                setError("キーワードの分析中にエラーが発生しました。");
            }
        } catch (e) {
            setError('キーワード分析に失敗しました。後で再試行してください。');
            console.error(e);
        } finally {
            setStage('idle');
        }
    }, [userUrl, competitorUrl1, competitorUrl2]);

    const handleSelectKeyword = (selectedTopic: string) => {
        setTopic(selectedTopic);
    };

    const handleFindArticles = useCallback(async () => {
        if (!topic.trim()) {
            setError('トピックを選択または入力してください。');
            return;
        }
        setError(null);
        setStage('findingArticles');
        setCompetitorArticles(null);
        try {
            const result = await findTopCompetitorArticles(topic);
            if(result) {
                setCompetitorArticles(result);
            } else {
                setError("競合記事の分析中にエラーが発生しました。");
            }
        } catch (e) {
            setError('競合記事の分析に失敗しました。後で再試行してください。');
        } finally {
            setStage('idle');
        }
    }, [topic]);

    const handleCreateCompositeArticle = useCallback(async () => {
        if (!competitorArticles || !topic) return;
        setError(null);
        setStage('creatingDraft');
        try {
            const result = await createCompositeArticle(topic, competitorArticles);
            if(result) {
                onDraftCreated(result);
            } else {
                 setError("複合記事の作成中にエラーが発生しました。");
            }
        } catch (e) {
            setError('複合記事の作成に失敗しました。後で再試行してください。');
        } finally {
            setStage('idle');
        }
    }, [topic, competitorArticles, onDraftCreated]);

    const isLoading = stage !== 'idle';

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-slate-800 animate-fadeInUp">
            <div className="space-y-4">
                {/* --- Step 1: Keyword Strategy --- */}
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800 text-white">1</div>
                        <h2 className="text-xl font-semibold text-slate-800">キーワード戦略を立てる</h2>
                        <Tooltip text="自社サイトと競合サイトのURLを基に、AIがSEOに有効なキーワード戦略を立案・提案します。">
                            <InformationCircleIcon className="w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors" />
                        </Tooltip>
                    </div>
                    <div className={`ml-5 pt-4 pb-8 border-l-2 border-slate-200`}>
                        <div className="pl-9 space-y-4">
                             <p className="text-slate-600">自社サイトと競合サイトのURLを入力して、狙うべきキーワードを分析します。</p>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="user-url" className="sr-only">自社サイトのURL</label>
                                    <input id="user-url" type="url" value={userUrl} onChange={(e) => setUserUrl(e.target.value)} placeholder="自社サイトのURL (例: https://example.com)" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} />
                                </div>
                                <div>
                                    <label htmlFor="competitor-url-1" className="sr-only">競合サイト1のURL</label>
                                    <input id="competitor-url-1" type="url" value={competitorUrl1} onChange={(e) => setCompetitorUrl1(e.target.value)} placeholder="競合サイト1のURL (任意)" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} />
                                </div>
                                <div>
                                    <label htmlFor="competitor-url-2" className="sr-only">競合サイト2のURL</label>
                                    <input id="competitor-url-2" type="url" value={competitorUrl2} onChange={(e) => setCompetitorUrl2(e.target.value)} placeholder="競合サイト2のURL (任意)" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} />
                                </div>
                            </div>
                            <button onClick={handleAnalyzeKeywords} disabled={isLoading || !userUrl} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed">
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                キーワードを分析
                            </button>
                             <div aria-live="polite">
                                {stage === 'analyzingKeywords' && <LoadingIndicator text="AIがキーワードを分析中..." />}
                                {error && !keywordAnalysis && <p className="mt-2 text-red-500">{error}</p>}
                             </div>
                        </div>
                    </div>
                </div>

                {/* --- Step 2: Display Keyword Analysis & Select Topic --- */}
                {keywordAnalysis && (
                <div className="animate-fadeIn">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800 text-white">2</div>
                        <h2 className="text-xl font-semibold text-slate-800">コンテンツのトピックを選択</h2>
                    </div>
                    <div className={`ml-5 pt-4 pb-8 border-l-2 border-slate-200`}>
                        <div className="pl-9 space-y-6">
                             <div>
                                <h3 className="font-semibold text-lg text-blue-600 mb-2">AIによる戦略サマリー</h3>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">{keywordAnalysis.summary}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-blue-600 mb-2">キーワード分析結果</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-slate-200 rounded-lg">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                {['キーワード', '検索ボリューム', '難易度', '現在ランク', '推奨度', 'アクション'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {keywordAnalysis.keywordAnalysis.map((kw, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{kw.keyword}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{kw.searchVolume}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{kw.difficulty}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{kw.currentRank}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">{kw.recommendation}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><button onClick={() => handleSelectKeyword(kw.keyword)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">選択</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-slate-600">分析結果からトピックを選択するか、下のボックスに直接入力してください。</p>
                                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                    <div>
                                       <label htmlFor="topic-input" className="sr-only">記事トピック</label>
                                       <input id="topic-input" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="選択したキーワードがここに表示されます" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} />
                                    </div>
                                    <button onClick={handleFindArticles} disabled={isLoading || !topic} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed">
                                        <SearchIcon className="w-5 h-5 mr-2" />
                                        競合記事を調査
                                    </button>
                                </div>
                                 <div aria-live="polite">
                                    {stage === 'findingArticles' && <LoadingIndicator text="競合記事を分析中..." />}
                                    {error && competitorArticles === null && <p className="mt-2 text-red-500">{error}</p>}
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
                
                {/* --- Step 3: Create Composite Article --- */}
                {competitorArticles && (
                    <div className="animate-fadeIn">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800 text-white">3</div>
                            <h2 className="text-xl font-semibold text-slate-800">複合記事を作成</h2>
                        </div>
                        <div className="ml-5 pt-4">
                            <div className="pl-9 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg text-blue-600 mb-2">競合上位記事</h3>
                                    <p className="text-slate-600 mb-4">以下の記事を参考にして、より網羅的で価値の高い記事を作成します。</p>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {competitorArticles.map((c, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <p className="font-bold text-slate-800 truncate">{c.title}</p>
                                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">{c.url}</a>
                                                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{c.summary}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <button onClick={handleCreateCompositeArticle} disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed">
                                        <PencilSquareIcon className="w-5 h-5 mr-2" />
                                        複合記事を作成する
                                    </button>
                                     <div aria-live="polite">
                                        {stage === 'creatingDraft' && <LoadingIndicator text="AIが複合記事を執筆中です..." />}
                                        {error && <p className="mt-2 text-red-500">{error}</p>}
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}