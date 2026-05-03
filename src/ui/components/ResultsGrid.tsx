import { ImagePlus, Trash2 } from 'lucide-react';
import { applyToBytes } from '../lib/colorAdjust';
import { sendToMain } from '../lib/messaging';
import { useStore } from '../state/store';
import { ResultCard } from './ResultCard';
import { Button } from './ui/Button';

export function ResultsGrid() {
  const jobs = useStore((s) => s.jobs);
  const adj = useStore((s) => s.adjustments);
  const clear = useStore((s) => s.clearJobs);

  if (jobs.length === 0) return null;

  const doneJobs = jobs.filter((j) => j.status === 'done' && j.bytes);

  const addAll = async () => {
    const payloads = await Promise.all(
      doneJobs.map(async (j) => ({
        bytes: await applyToBytes(j.bytes!, j.mimeType ?? 'image/png', adj),
        width: j.width,
        height: j.height,
        label: `${j.modelLabel} — ${j.formFactorLabel} — ${j.sceneLabel}`,
      })),
    );
    sendToMain({ type: 'add-images', payloads });
  };

  return (
    <section className="rounded-xl2 border border-border-subtle bg-bg-panel p-3.5">
      <header className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Results
          </h3>
          <p className="text-[11px] text-text-faint mt-0.5">
            {jobs.length} {jobs.length === 1 ? 'image' : 'images'}
            {doneJobs.length !== jobs.length && ` · ${doneJobs.length} ready`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={clear}
            iconLeft={<Trash2 className="size-3" />}
          >
            Clear
          </Button>
          {jobs.length > 1 && (
            <Button
              size="sm"
              variant="primary"
              onClick={addAll}
              disabled={doneJobs.length === 0}
              iconLeft={<ImagePlus className="size-3" />}
            >
              Add all
            </Button>
          )}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2.5 items-start">
        {jobs.map((j) => (
          <ResultCard key={j.id} job={j} />
        ))}
      </div>
    </section>
  );
}
