import clsx from 'clsx';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
  suffix?: string;
  className?: string;
}

export function Slider({ value, min, max, step = 1, onChange, label, suffix = '', className }: Props) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-xs text-text-faint tabular-nums">
            {value}
            {suffix}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-bg-input rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}
