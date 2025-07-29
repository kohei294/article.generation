import React, { useState, useEffect, useCallback } from 'react';
import { ArticleDraft, FullArticle, SocialMediaPosts } from '../../types';
import { generateFullArticle, reviseFullArticle, generateSocialMediaPosts } from '../../services/geminiService';
import { SparklesIcon, ClipboardIcon, ArrowPathIcon, ShareIcon, InformationCircleIcon } from '../icons';
import Tooltip from '../Tooltip';

interface CreationStepProps {
    initialDraft?: ArticleDraft | null;
}

const LoadingIndicator: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center justify-center space-x-2 text-blue-600 my-4">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{text}</span>
    </div>
);

export default function CreationStep({ initialDraft = null }: CreationStepProps) {
    const [draft, setDraft] = useState<ArticleDraft | null>(initialDraft);
    const [fullArticle, setFullArticle] = useState<FullArticle | null>(null);
    const [socialPosts, setSocialPosts] = useState<SocialMediaPosts | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [revisionPrompt, setRevisionPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        setDraft(initialDraft);
        // Reset when a new draft comes in
        setFullArticle(null);
        setSocialPosts(null);
        setError(null);
        setIsGenerating(false);
        setIsRevising(false);
        setRevisionPrompt('');
    }, [initialDraft]);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };
    
    const handleGenerateArticle = useCallback(async () => {
        if (!draft) return;

        setIsGenerating(true);
        setError(null);
        setFullArticle(null);
        setSocialPosts(null);
        setRevisionPrompt('');

        try {
            const articleResult = await generateFullArticle(draft);
            if (articleResult) {
                setFullArticle(articleResult);
                const socialResult = await generateSocialMediaPosts(articleResult);
                if (socialResult) {
                    setSocialPosts(socialResult);
                } else {
                    console.error("Failed to generate social media posts, but article generation was successful.");
                }
            } else {
                setError("記事の生成中にエラーが発生しました。");
            }
        } catch (e) {
            console.error(e);
            setError("記事の生成に失敗しました。後でもう一度お試しください。");
        } finally {
            setIsGenerating(false);
        }
    }, [draft]);

    const handleReviseArticle = useCallback(async () => {
        if (!fullArticle || !revisionPrompt.trim()) return;

        setIsRevising(true);
        setError(null);
        setSocialPosts(null); // Clear social posts as they are now outdated

        try {
            const result = await reviseFullArticle(fullArticle, revisionPrompt);
            if (result) {
                setFullArticle(result);
                setRevisionPrompt(''); // Clear prompt on success
            } else {
                setError("記事の修正中にエラーが発生しました。");
            }
        } catch (e) {
            console.error(e);
            setError("記事の修正に失敗しました。後でもう一度お試しください。");
        } finally {
            setIsRevising(false);
        }
    }, [fullArticle, revisionPrompt]);

    if (!draft) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-slate-800 text-center animate-fadeInUp">
                <div className="flex items-center space-x-3 mb-6 justify-center">
                     <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-slate-800 text-white">
                        2
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">記事の生成</h2>
                </div>
                <div className="py-12">
                  <p className="text-slate-600">準備ステップでトピックを分析し、複合記事を作成してください。</p>
                  <p className="text-slate-600 mt-2">生成された記事ドラフトはここに表示されます。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-slate-800 space-y-8 animate-fadeInUp">
            {/* Draft Section */}
            <div>
                <h3 className="text-3xl font-bold text-blue-600 tracking-tight">{draft.outline.title}</h3>
                
                <div className="mt-8">
                    <h4 className="text-xl font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-blue-500 mr-2">#</span>
                      導入文
                    </h4>
                    <div className="prose prose-p:text-slate-700 bg-slate-50 p-6 rounded-lg border border-slate-200">
                       <p>{draft.introduction}</p>
                    </div>
                </div>

                <div className="mt-8">
                    <h4 className="text-xl font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-blue-500 mr-2">#</span>
                      記事アウトライン
                    </h4>
                    <div className="space-y-4">
                        {draft.outline.sections.map((section, index) => (
                            <div key={index} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <h5 className="text-lg font-bold text-blue-500">{section.heading}</h5>
                                <ul className="list-disc list-inside text-slate-600 mt-3 space-y-2">
                                    {section.points.map((point, pIndex) => (
                                        <li key={pIndex}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Generation Section */}
            <div className="pt-8 border-t border-slate-200">
                {!fullArticle && (
                    <div className="text-center">
                        <button 
                            onClick={handleGenerateArticle} 
                            disabled={isGenerating} 
                            className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-6 h-6 mr-3" />
                            記事全体とSNS投稿を生成する
                        </button>
                        <div aria-live="polite">
                            {isGenerating && <LoadingIndicator text="AIが記事を執筆しています..." />}
                            {error && <p className="mt-4 text-red-500">{error}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Result & Revision Section */}
            {fullArticle && (
                <div className="pt-8 border-t border-slate-200 space-y-8 animate-fadeIn">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-blue-500">生成された記事</h3>
                            <button onClick={() => handleCopy(fullArticle, 'article')} className="flex items-center justify-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-lg text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition disabled:opacity-50">
                                <ClipboardIcon className="w-5 h-5 mr-2" />
                                {copiedKey === 'article' ? 'コピーしました！' : 'コピー'}
                            </button>
                        </div>
                        <div className="prose max-w-none prose-p:text-slate-700 prose-headings:text-blue-600 bg-slate-50 p-6 rounded-lg border border-slate-200 whitespace-pre-wrap">
                            {fullArticle}
                        </div>
                    </div>

                    <div aria-live="polite">
                        {isGenerating && !socialPosts && <LoadingIndicator text="SNS投稿を生成中..." />}
                    </div>

                    {/* Social Media Posts Section */}
                    {socialPosts && (
                        <div className="pt-8 mt-8 border-t border-slate-200 space-y-6">
                            <h3 className="text-2xl font-bold text-blue-500 flex items-center">
                                <ShareIcon className="w-6 h-6 mr-3" />
                                SNS投稿案
                            </h3>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-semibold text-slate-800">共通ハッシュタグ</h4>
                                    <button onClick={() => handleCopy(socialPosts.hashtags.join(' '), 'hashtags')}  className="flex items-center px-3 py-1.5 border border-blue-500 text-xs font-medium rounded-lg text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition">
                                        <ClipboardIcon className="w-4 h-4 mr-2" />
                                        {copiedKey === 'hashtags' ? 'コピー済み' : 'コピー'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    {socialPosts.hashtags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {tag}
                                    </span>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {(['x', 'facebook', 'linkedin'] as const).map(platform => (
                                    <div key={platform} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="text-lg font-bold text-slate-800 capitalize">{platform === 'x' ? 'X (Twitter)' : platform}</h5>
                                            <button onClick={() => handleCopy(socialPosts[platform], platform)} className="flex items-center px-3 py-1.5 border border-blue-500 text-xs font-medium rounded-lg text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition">
                                                <ClipboardIcon className="w-4 h-4 mr-2" />
                                                {copiedKey === platform ? 'コピー済み' : 'コピー'}
                                            </button>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap">{socialPosts[platform]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-200">
                        <label htmlFor="revision-prompt" className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                           記事を修正する
                           <Tooltip text="生成された記事に対して、より具体的な改善指示（例：「ですます調に統一して」「専門用語を解説して」）を与えることができます。">
                                <InformationCircleIcon className="w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors" />
                           </Tooltip>
                        </label>
                        <p id="revision-description" className="text-slate-600 mb-4">
                            生成された記事に対して、さらに修正や追加の指示を出すことができます。「もっと専門的なトーンで」「具体例を3つ追加して」のように入力してください。
                        </p>
                        <textarea
                            id="revision-prompt"
                            rows={4}
                            value={revisionPrompt}
                            onChange={(e) => setRevisionPrompt(e.target.value)}
                            placeholder="修正指示を入力..."
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono text-sm"
                            disabled={isRevising || isGenerating}
                            aria-describedby="revision-description"
                        />
                        <div className="mt-4">
                            <button
                                onClick={handleReviseArticle}
                                disabled={isRevising || isGenerating || !revisionPrompt.trim()}
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                <ArrowPathIcon className="w-5 h-5 mr-2" />
                                {isRevising ? '修正中...' : '修正を反映する'}
                            </button>
                        </div>
                        <div aria-live="polite">
                            {isRevising && <LoadingIndicator text="AIが記事を修正しています..." />}
                            {error && !isGenerating && <p className="mt-4 text-red-500">{error}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}