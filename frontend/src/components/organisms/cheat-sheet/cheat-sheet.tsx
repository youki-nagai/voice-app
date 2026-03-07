import { Keyboard, MessageSquarePlus, Mic, Mouse, Type, X } from "lucide-react";
import { useEffect } from "react";

interface CheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SheetItem {
  label: string;
  description: string;
  voice?: string;
}

interface SheetSection {
  icon: React.ReactNode;
  title: string;
  note?: string;
  items: SheetItem[];
}

const sections: SheetSection[] = [
  {
    icon: <Mic className="h-4 w-4" />,
    title: "音声入力",
    note: "マイクONで話すだけ。全ての指示を音声で出せます。",
    items: [
      { label: "マイクボタン", description: "音声入力の開始 / 停止" },
      { label: "1秒の沈黙", description: "自動でメッセージ送信" },
      {
        label: "自由な指示",
        description: "話した内容がそのままAIへの指示になる",
      },
    ],
  },
  {
    icon: <Mouse className="h-4 w-4" />,
    title: "モデル切替",
    items: [
      {
        label: "ヘッダーのボタン",
        description: "Opus / Sonnet を切り替え",
        voice: "「Opusに切り替えて」「Sonnetに」",
      },
    ],
  },
  {
    icon: <Type className="h-4 w-4" />,
    title: "テキスト入力",
    note: "音声の代わりにテキストでも同じ指示が可能です。",
    items: [
      { label: "Cmd + Enter", description: "メッセージ送信" },
      { label: "画像ペースト", description: "Cmd+V で画像を添付" },
    ],
  },
  {
    icon: <MessageSquarePlus className="h-4 w-4" />,
    title: "チャット管理",
    items: [
      { label: "＋ ボタン", description: "新しいチャットセッションを追加" },
      { label: "タブクリック", description: "セッション切り替え" },
      { label: "× ボタン", description: "セッションを閉じる" },
    ],
  },
  {
    icon: <Keyboard className="h-4 w-4" />,
    title: "キーボード",
    items: [{ label: "Cmd + /", description: "このチートシートの開閉" }],
  },
];

export function CheatSheet({ isOpen, onClose }: CheatSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click to close */}
      <div
        data-testid="cheat-sheet-backdrop"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">使い方</h2>
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Cmd + /
            </kbd>
            <button
              type="button"
              title="閉じる"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                {section.note && (
                  <p className="mb-2 px-2 text-[11px] text-muted-foreground">
                    {section.note}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="shrink-0 font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-right text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                      {item.voice && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-400">
                          <Mic className="h-3 w-3" />
                          <span>{item.voice}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
