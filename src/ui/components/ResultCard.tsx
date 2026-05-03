import clsx from 'clsx';
import { AlertCircle, Check, Copy, Download, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { applyToBytes, buildCssFilter } from '../lib/colorAdjust';
import { sendToMain } from '../lib/messaging';
import { useStore, type ResultJob } from '../state/store';

interface Props {
  job: ResultJob;
}

export function ResultCard({ job }: Props) {
  const adj = useStore((s) => s.adjustments);
  const removeJob = useStore((s) => s.removeJob);
  const inFigma = useStore((s) => s.inFigma);
  const [copied, setCopied] = useState(false);

  const copyError = async () => {
    if (!job.error) return;
    try {
      await navigator.clipboard.writeText(job.error);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = job.error;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const blobUrl = useMemo(() => {
    if (!job.bytes) return undefined;
    const blob = new Blob([job.bytes as BlobPart], { type: job.mimeType ?? 'image/png' });
    return URL.createObjectURL(blob);
  }, [job.bytes, job.mimeType]);

  useEffect(() => {
    if (!blobUrl) return;
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  const overlayRef = useRef<HTMLDivElement>(null);

  const filename = useMemo(() => {
    const base = `${job.modelLabel}-${job.formFactorLabel}-${job.sceneLabel}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const ext = (job.mimeType ?? 'image/png').split('/')[1]?.split('+')[0] ?? 'png';
    return `${base || 'image'}.${ext}`;
  }, [job.modelLabel, job.formFactorLabel, job.sceneLabel, job.mimeType]);

  const processedUrl = async () => {
    if (!job.bytes) return undefined;
    const processed = await applyToBytes(job.bytes, job.mimeType ?? 'image/png', adj);
    const blob = new Blob([processed as BlobPart], { type: job.mimeType ?? 'image/png' });
    return URL.createObjectURL(blob);
  };

  const addToCanvas = async () => {
    if (!job.bytes) return;
    const processed = await applyToBytes(job.bytes, job.mimeType ?? 'image/png', adj);
    sendToMain({
      type: 'add-image',
      payload: {
        bytes: processed,
        width: job.width,
        height: job.height,
        label: `${job.modelLabel} — ${job.formFactorLabel} — ${job.sceneLabel}`,
      },
    });
  };

  const downloadImage = async () => {
    const url = await processedUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  const previewImage = async () => {
    const url = await processedUrl();
    if (!url) return;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Popup blocked — fall back to clicking an anchor (works in more sandboxes)
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const aspect = job.width / job.height;
  const containerClass = aspect > 1 ? 'aspect-[16/9]' : aspect < 1 ? 'aspect-[9/16]' : 'aspect-square';

  return (
    <div className="rounded-xl2 border border-border-subtle bg-bg-panel overflow-hidden flex flex-col">
      <div className={clsx('relative bg-bg-subtle overflow-hidden', containerClass)}>
        {job.status === 'done' && blobUrl && (
          <>
            <img
              src={blobUrl}
              alt={job.promptShort}
              className="absolute inset-0 size-full object-cover"
              style={{ filter: buildCssFilter(adj) }}
            />
            {adj.overlay.enabled && (
              <div
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: adj.overlay.color,
                  opacity: adj.overlay.opacity,
                  mixBlendMode: adj.overlay.blendMode as React.CSSProperties['mixBlendMode'],
                }}
              />
            )}
          </>
        )}
        {(job.status === 'pending' || job.status === 'running') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-faint">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-[11px]">{job.status === 'pending' ? 'Queued' : 'Generating…'}</span>
          </div>
        )}
        {job.status === 'error' && (
          <div className="absolute inset-0 flex flex-col gap-1.5 p-2 text-text-danger">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-2xs font-medium">
                <AlertCircle className="size-3" />
                Error
              </div>
              <button
                type="button"
                onClick={copyError}
                title="Copy error"
                className="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium bg-bg-subtle border border-border hover:border-border-brand text-text-muted hover:text-text"
              >
                {copied ? (
                  <>
                    <Check className="size-2.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-2.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded bg-bg border border-border p-1.5 text-[10px] leading-snug whitespace-pre-wrap break-words font-mono text-text-muted">
              {job.error}
            </div>
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-text truncate">{job.modelLabel}</div>
            <div className="text-[10px] text-text-faint truncate">
              {job.formFactorLabel} · {job.sceneLabel} ·{' '}
              <span title={
                job.requestedWidth && (job.requestedWidth !== job.width || job.requestedHeight !== job.height)
                  ? `Requested ${job.requestedWidth}×${job.requestedHeight}; model returned this size`
                  : undefined
              }>
                {job.width}×{job.height}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeJob(job.id)}
            className="text-text-faint hover:text-text shrink-0"
            title="Remove"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            disabled={job.status !== 'done'}
            onClick={addToCanvas}
            className={clsx(
              'flex-1 inline-flex items-center justify-center gap-1 h-6 rounded text-2xs font-medium transition-colors',
              job.status === 'done'
                ? 'bg-bg-brand-subtle text-text-brand border border-border-brand hover:bg-brand hover:text-text-onbrand hover:border-transparent'
                : 'bg-bg-subtle text-text-faint border border-border cursor-not-allowed',
            )}
          >
            <Plus className="size-2.5" /> Add to canvas
          </button>
          {!inFigma && (
            <button
              type="button"
              disabled={job.status !== 'done'}
              onClick={previewImage}
              title="Open in new tab"
              className={clsx(
                'inline-flex items-center justify-center size-6 rounded border transition-colors',
                job.status === 'done'
                  ? 'bg-bg-subtle hover:bg-bg-input border-border text-text-muted hover:text-text'
                  : 'bg-bg-subtle text-text-faint border-border cursor-not-allowed',
              )}
            >
              <ExternalLink className="size-3" />
            </button>
          )}
          <button
            type="button"
            disabled={job.status !== 'done'}
            onClick={downloadImage}
            title="Download"
            className={clsx(
              'inline-flex items-center justify-center size-6 rounded border transition-colors',
              job.status === 'done'
                ? 'bg-bg-subtle hover:bg-bg-input border-border text-text-muted hover:text-text'
                : 'bg-bg-subtle text-text-faint border-border cursor-not-allowed',
            )}
          >
            <Download className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
