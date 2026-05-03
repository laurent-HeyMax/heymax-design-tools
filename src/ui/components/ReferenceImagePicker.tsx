import { ImagePlus, Link2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { fileToDataUrl } from '../lib/imageBytes';
import { useStore } from '../state/store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Section } from './ui/Section';

export function ReferenceImagePicker() {
  const ref = useStore((s) => s.referenceImage);
  const setRef = useStore((s) => s.setReferenceImage);
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setRef({ kind: 'data', dataUrl, mimeType: file.type });
  };

  const submitUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setRef({ kind: 'url', url: trimmed });
    setUrl('');
  };

  return (
    <Section
      title="Reference image"
      defaultOpen={false}
      collapsible
      trailing={
        ref && (
          <button
            type="button"
            onClick={() => setRef(undefined)}
            className="text-text-faint hover:text-text"
            title="Remove reference"
          >
            <X className="size-3.5" />
          </button>
        )
      }
    >
      {ref ? (
        <div className="flex items-center gap-3">
          <img
            src={ref.kind === 'data' ? ref.dataUrl : ref.url}
            alt="reference"
            className="size-16 rounded-lg object-cover border border-border"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-muted">
              {ref.kind === 'data' ? 'Uploaded image' : 'URL'}
            </div>
            {ref.kind === 'url' && (
              <div className="text-xs text-text-faint truncate">{ref.url}</div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            className={
              'flex flex-col items-center justify-center gap-1 py-4 rounded-md border border-dashed cursor-pointer transition-colors ' +
              (dragOver ? 'border-border-brand bg-bg-brand-subtle' : 'border-border bg-bg-subtle hover:bg-bg-tertiary')
            }
          >
            <ImagePlus className="size-5 text-text-faint" />
            <div className="text-xs text-text-muted">Drop an image, or click to upload</div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-faint" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="…or paste an image URL"
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && submitUrl()}
              />
            </div>
            <Button size="sm" onClick={submitUrl} disabled={!url.trim()}>
              Use
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-text-faint">
            Only models that support reference images will be enabled when set.
          </p>
        </>
      )}
    </Section>
  );
}
