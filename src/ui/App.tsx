import { useEffect } from 'react';
import { DEFAULT_SETTINGS, FORM_FACTORS } from '@shared/presets';
import { onFromMain, sendToMain } from './lib/messaging';
import { useStore } from './state/store';
import { CreativesView } from './views/CreativesView';
import { HomeView } from './views/HomeView';
import { ImageGenView } from './views/ImageGenView';
import { NameCardView } from './views/NameCardView';

export function App() {
  const view = useStore((s) => s.view);
  const initialized = useStore((s) => s.initialized);
  const setSettings = useStore((s) => s.setSettings);
  const applyDefaults = useStore((s) => s.applyDefaults);

  useEffect(() => {
    const initFrom = (settings: typeof DEFAULT_SETTINGS) => {
      setSettings(settings);
      applyDefaults();
      const ff = settings.defaults.formFactor;
      useStore.setState({ formFactors: [ff] });
      const matched = FORM_FACTORS.find((f) => f.id === ff);
      if (matched) {
        useStore.setState({
          customDimensions: { enabled: false, width: matched.width, height: matched.height },
        });
      }
    };

    const off = onFromMain((msg) => {
      if (msg.type === 'init') {
        useStore.getState().setInFigma(true);
        initFrom(msg.settings);
      }
    });
    sendToMain({ type: 'ready' });

    const fallback = window.setTimeout(() => {
      if (!useStore.getState().initialized) initFrom(DEFAULT_SETTINGS);
    }, 400);

    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [setSettings, applyDefaults]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center text-text-faint text-xs">
        Loading…
      </div>
    );
  }

  if (view === 'image-gen') return <ImageGenView />;
  if (view === 'name-card') return <NameCardView />;
  if (view === 'creatives') return <CreativesView />;
  return <HomeView />;
}
