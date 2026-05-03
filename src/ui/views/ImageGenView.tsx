import clsx from 'clsx';
import { ArrowLeft, Check, ChevronLeft, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorAdjustmentsPanel } from '../components/ColorAdjustments';
import { CustomizationsSection } from '../components/CustomizationsSection';
import { ModelSelector } from '../components/ModelSelector';
import { PresetsSection } from '../components/PresetsSection';
import { PromptPanel } from '../components/PromptPanel';
import { ReferenceImagePicker } from '../components/ReferenceImagePicker';
import { ResultsGrid } from '../components/ResultsGrid';
import { SettingsPanel } from '../components/SettingsPanel';
import { Button } from '../components/ui/Button';
import { ResizeHandle } from '../components/ui/ResizeHandle';
import { sendToMain } from '../lib/messaging';
import { useGenerate } from '../lib/useGenerate';
import { useStore } from '../state/store';

export function ImageGenView() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const setView = useStore((s) => s.setView);
  const formFactors = useStore((s) => s.formFactors);
  const scenes = useStore((s) => s.scenes);
  const cd = useStore((s) => s.customDimensions);
  const jobs = useStore((s) => s.jobs);
  const promptEmpty = useStore((s) => !s.prompt.trim() && !s.cityId);
  const generate = useGenerate();

  const [savedFlash, setSavedFlash] = useState(false);

  const totalJobs = useMemo(() => {
    const ffCount = cd.enabled ? 1 : formFactors.length;
    return ffCount * scenes.length;
  }, [formFactors, scenes, cd.enabled]);

  const anyRunning = jobs.some((j) => j.status === 'running' || j.status === 'pending');

  const mainRef = useRef<HTMLDivElement>(null);
  const prevJobCount = useRef(jobs.length);
  useEffect(() => {
    if (jobs.length > prevJobCount.current && mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevJobCount.current = jobs.length;
  }, [jobs.length]);

  const closeSettings = () => {
    sendToMain({ type: 'save-settings', settings: useStore.getState().settings });
    setTab('generate');
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className="flex h-screen flex-col bg-bg text-text font-sans">
      <header className="flex items-center gap-1.5 px-3 h-9 border-b border-border bg-bg">
        {tab === 'generate' && (
          <button
            type="button"
            onClick={() => setView('home')}
            title="Back to tools"
            className="inline-flex items-center justify-center size-6 rounded text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
          >
            <ArrowLeft className="size-3.5" />
          </button>
        )}
        <h2 className="text-xs font-semibold text-text">
          {tab === 'settings' ? 'Image Generator settings' : 'Image Generator'}
        </h2>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'generate' ? (
          <>
            <ResultsGrid />
            <PromptPanel />
            <ModelSelector />
            <ReferenceImagePicker />
            <PresetsSection />
            <CustomizationsSection />
            <ColorAdjustmentsPanel />
          </>
        ) : (
          <SettingsPanel />
        )}
      </main>

      <footer className="border-t border-border bg-bg p-3">
        {tab === 'generate' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={generate}
              disabled={anyRunning || totalJobs === 0 || promptEmpty}
              iconLeft={
                savedFlash ? <Check className="size-4" /> : <Sparkles className="size-4" />
              }
              className="flex-1"
              title={promptEmpty ? 'Enter a prompt first' : undefined}
            >
              {savedFlash
                ? 'Settings saved'
                : anyRunning
                  ? 'Generating…'
                  : promptEmpty
                    ? 'Enter a prompt'
                    : `Generate ${totalJobs} ${totalJobs === 1 ? 'image' : 'images'}`}
            </Button>
            <button
              type="button"
              onClick={() => setTab('settings')}
              title="Settings"
              className={clsx(
                'inline-flex items-center justify-center size-9 rounded-md border transition-colors shrink-0',
                'bg-bg-subtle hover:bg-bg-tertiary border-border text-text-muted hover:text-text',
              )}
            >
              <SettingsIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={closeSettings}
            iconLeft={<ChevronLeft className="size-4" />}
          >
            Back to Generate
          </Button>
        )}
      </footer>
      <ResizeHandle />
    </div>
  );
}
