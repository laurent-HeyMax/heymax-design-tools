import { ChevronRight, IdCard, ImageIcon, type LucideIcon } from "lucide-react";
import { ResizeHandle } from "../components/ui/ResizeHandle";
import { useStore, type ToolId } from "../state/store";

interface ToolTile {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
  available: true;
}

interface ComingSoonTile {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  available: false;
}

const TOOLS: (ToolTile | ComingSoonTile)[] = [
  {
    id: "image-gen",
    name: "Image Generator",
    description:
      "Generate images from prompts using Replicate, OpenAI, or Google Gemini.",
    icon: ImageIcon,
    available: true,
  },
  {
    id: "name-card",
    name: "Name Card Generator",
    description:
      "Generate a name card (front & back) with your details.",
    icon: IdCard,
    available: true,
  },
];

export function HomeView() {
  const setView = useStore((s) => s.setView);

  return (
    <div className="flex h-screen flex-col bg-bg text-text font-sans">
      <header className="px-3.5 pt-4 pb-3">
        <div className="text-2xs font-medium text-text-muted tabular-nums">
          v{__APP_VERSION__}
        </div>
        <p className="mt-1 text-2xs text-text-faint leading-snug">
          Pick a tool to get started. More coming soon.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-3 pb-3">
        <ul className="space-y-1.5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isAvailable = t.available;
            const onClick = isAvailable
              ? () => setView(t.id as ToolId)
              : undefined;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={onClick}
                  disabled={!isAvailable}
                  className={
                    "group w-full text-left rounded-md border border-border bg-bg-subtle px-3 py-2.5 transition-colors " +
                    (isAvailable
                      ? "cursor-pointer hover:bg-bg-tertiary hover:border-border-strong"
                      : "opacity-50 cursor-not-allowed")
                  }
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 size-7 shrink-0 rounded-md bg-bg flex items-center justify-center border border-border">
                      <Icon className="size-3.5 text-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-text">
                          {t.name}
                        </span>
                        {!isAvailable && (
                          <span className="text-[10px] font-medium uppercase tracking-wide text-text-faint border border-border rounded px-1 py-px">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-2xs text-text-muted leading-snug">
                        {t.description}
                      </p>
                    </div>
                    {isAvailable && (
                      <ChevronRight className="mt-1.5 size-3.5 text-text-faint shrink-0 group-hover:text-text transition-colors" />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <ResizeHandle />
    </div>
  );
}
