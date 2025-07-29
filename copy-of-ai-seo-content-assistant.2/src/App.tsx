import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppStep, ArticleDraft } from './types';
import PasswordModal from './components/PasswordModal';
import Header from './components/Header';
import PreparationStep from './components/steps/PreparationStep';
import CreationStep from './components/steps/CreationStep';
import AnalysisStep from './components/steps/AnalysisStep';

const AUTH_KEY = 'isAuthenticated';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Preparation);
  const [creationDraft, setCreationDraft] = useState<ArticleDraft | null>(null);

  useEffect(() => {
    // Sets the user as authenticated if they have previously logged in during the session.
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    sessionStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
  }, []);

  const handleDraftCreated = useCallback((draft: ArticleDraft) => {
    setCreationDraft(draft);
    setCurrentStep(AppStep.Creation);
  }, []);

  const renderCurrentStep = useMemo(() => {
    switch (currentStep) {
      case AppStep.Preparation:
        return <PreparationStep onDraftCreated={handleDraftCreated} />;
      case AppStep.Creation:
        return <CreationStep initialDraft={creationDraft} />;
      case AppStep.Analysis:
        return <AnalysisStep />;
      default:
        return <PreparationStep onDraftCreated={handleDraftCreated} />;
    }
  }, [currentStep, creationDraft, handleDraftCreated]);

  if (!isAuthenticated) {
    return <PasswordModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="relative container mx-auto px-4 py-8">
        <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <main className="mt-8">
          {renderCurrentStep}
        </main>
        <footer className="text-center mt-12 text-xs text-slate-500">
          <p>Powered by Google Gemini API. For planning and drafting purposes.</p>
        </footer>
      </div>
    </div>
  );
}