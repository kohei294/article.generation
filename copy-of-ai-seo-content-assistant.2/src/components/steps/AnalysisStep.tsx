import React, { useState, useCallback } from 'react';
import { PerformanceAnalysis } from '../../types';
import { analyzePerformanceData } from '../../services/geminiService';
import { DocumentArrowDownIcon, InformationCircleIcon } from '../icons';
import Tooltip from '../Tooltip';

const downloadCSV = (data: PerformanceAnalysis, filename: string) => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Summary
    csvContent += "Summary\n";
    csvContent += `"${data.summary.replace(/"/g, '""')}"\n\n`;

    // Key Metrics
    csvContent += "Key Metrics\n";
    csvContent += "Metric,Value\n";
    csvContent += `Monthly PV,${data.keyMetrics.monthlyPV}\n`;
    csvContent += `Users,${data.keyMetrics.users}\n`;
    csvContent += `Conversion Rate,${data.keyMetrics.cvr}\n`;
    csvContent += `Bounce Rate,${data.keyMetrics.bounceRate}\n\n`;

    // Traffic Sources
    csvContent += "Traffic Sources\n";
    csvContent += "Source,Percentage\n";
    data.trafficSources.forEach(source => {
        csvContent += `${source.source},${source.percentage}%\n`;
    });
    csvContent += "\n";

    // Keyword Performance
    csvContent += "Keyword Performance\n";
    csvContent += "Keyword,Estimated PV\n";
    data.keywordPerformance.forEach(kw => {
        csvContent += `"${kw.keyword.replace(/"/g, '""')}",${kw.estimatedPV}\n`;
    });
    csvContent += "\n";

    // Action Plan
    const headers = ['Action', 'Justification'];
    const rows = data.actionPlan.map(item => [
        `"${item.action.replace(/"/g, '""')}"`,
        `"${item.justification.replace(/"/g, '""')}"`
    ]);
    csvContent += "Action Plan\n";
    csvContent += headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h4 className="text-sm font-medium text-slate-500">{title}</h4>
        <p className="mt-1 text-3xl font-semibold text-blue-500">{value}</p>
    </div>
);

const BarChart: React.FC<{ title: string; data: { label: string, value: number, color: string, percentage?: boolean }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">{title}</h4>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3">
                        <span className="text-sm text-slate-600 truncate" title={item.label}>{item.label}</span>
                        <div className="bg-slate-200 rounded-full h-4 w-full">
                            <div className={`${item.color} h-4 rounded-full`} style={{ width: `${(item.value / maxValue) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-800">{item.percentage ? `${item.value}%` : item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function AnalysisStep() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [articleUrl, setArticleUrl] = useState('');
    const [socialUrl, setSocialUrl] = useState('');
    const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);

    const handleGenerateReport = useCallback(async () => {
        if (!articleUrl.trim() || !articleUrl.startsWith('http')) {
            setError('有効な記事のURLを入力してください。');
            return;
        }

        setError(null);
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result: PerformanceAnalysis | null = await analyzePerformanceData(articleUrl, socialUrl);
            if (result) {
                setAnalysis(result);
            } else {
                setError("分析レポートの生成中にエラーが発生しました。");
            }
        } catch (e) {
            setError('分析レポートの生成に失敗しました。後で再試行してください。');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [articleUrl, socialUrl]);

    const handleDownload = () => {
        if (analysis) {
            let filename = 'performance_report';
            if (articleUrl) {
                try {
                    const url = new URL(articleUrl);
                    const domain = url.hostname.replace(/^www\./, '');
                    const sanitizedDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
                    filename = `performance_report_${sanitizedDomain}`;
                } catch (e) {
                    // Ignore invalid URL, use default filename
                }
            }
            downloadCSV(analysis, filename);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-slate-800 animate-fadeInUp">
            <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold text-slate-800">記事の流入状況を分析（シミュレーション）</h2>
                    <Tooltip text="公開した記事のURLを入力すると、AIがアクセス解析データ（月間PV、流入経路、キーワード順位など）をシミュレートし、具体的な改善案まで提示します。">
                        <InformationCircleIcon className="w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors" />
                    </Tooltip>
                 </div>
                 <p className="text-slate-600 mb-6">
                    この記事分析機能は、公開後のパフォーマンスをシミュレーションします。SNS投稿URLを任意で追加すると、SNSからの流入も含めた分析が可能です。AIがGoogle Analyticsなどのデータを模したリアルなレポートを生成します。
                 </p>
                <div className="space-y-4 mb-4">
                    <div>
                        <label htmlFor="article-url" className="sr-only">記事URL</label>
                        <input id="article-url" type="url" value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} placeholder="https://example.com/your-article-path" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} required />
                    </div>
                    <div>
                        <label htmlFor="social-url" className="sr-only">SNS投稿URL (任意)</label>
                        <input id="social-url" type="url" value={socialUrl} onChange={(e) => setSocialUrl(e.target.value)} placeholder="https://x.com/your-post (任意)" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" disabled={isLoading} />
                    </div>
                </div>
                 <div aria-live="polite" className="text-center">
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                 </div>
                <div className="mt-6 text-center">
                    <button onClick={handleGenerateReport} disabled={isLoading || !articleUrl} className="w-full md:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>生成中...</> ) : '分析レポートを生成'}
                    </button>
                </div>
            </div>

            {analysis && (
                 <div className="mt-8 pt-8 border-t border-slate-200/80 space-y-8 animate-fadeIn">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <h3 className="text-2xl font-bold text-blue-500">パフォーマンスダッシュボード</h3>
                         <button onClick={handleDownload} className="flex items-center justify-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-lg text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition">
                            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                            CSVでダウンロード
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="月間PV数" value={analysis.keyMetrics.monthlyPV} />
                        <StatCard title="ユーザー数" value={analysis.keyMetrics.users} />
                        <StatCard title="CVR" value={analysis.keyMetrics.cvr} />
                        <StatCard title="直帰率" value={analysis.keyMetrics.bounceRate} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <BarChart title="流入経路" data={analysis.trafficSources.map(s => ({label: s.source, value: s.percentage, color: 'bg-blue-500', percentage: true}))} />
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                             <h4 className="text-lg font-semibold text-slate-800 mb-4">成果の高いキーワード</h4>
                             <div className="overflow-x-auto">
                                 <table className="w-full min-w-max">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left text-sm font-medium text-slate-500 pb-2">キーワード</th>
                                            <th className="text-right text-sm font-medium text-slate-500 pb-2">推定PV</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {analysis.keywordPerformance.map((kw, i) => (
                                        <tr key={i} className="border-b border-slate-100 last:border-b-0">
                                            <td className="py-2 text-sm text-slate-800">{kw.keyword}</td>
                                            <td className="py-2 text-sm text-blue-500 text-right font-semibold">{kw.estimatedPV.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                 </table>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold text-slate-800 mb-2">パフォーマンス要約</h4>
                        <div className="prose max-w-none prose-p:text-slate-600 bg-slate-50 p-6 rounded-lg border border-slate-200">
                           <p>{analysis.summary}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold text-slate-800 mb-2">3ヶ月改善アクションプラン</h4>
                        <div className="space-y-4">
                            {analysis.actionPlan.map((plan, index) => (
                                <div key={index} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                    <h5 className="text-lg font-bold text-blue-500">{index + 1}. {plan.action}</h5>
                                    <p className="text-slate-600 mt-2">{plan.justification}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}