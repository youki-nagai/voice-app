import { Keyboard, MessageSquarePlus, Mic, Mouse, Type } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
      {
        label: "沈黙で自動送信",
        description: "マイク横の±ボタンで秒数を調整",
        voice: "「待ち時間3秒」「沈黙2秒」",
      },
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
      {
        label: "＋ ボタン",
        description: "新しいチャットセッションを追加",
        voice: "「新しいチャット」「チャット追加」",
      },
      {
        label: "タブクリック",
        description: "セッション切り替え",
        voice: "「チャット1に」「次のチャット」「前のチャット」",
      },
      { label: "× ボタン", description: "セッションを閉じる" },
    ],
  },
  {
    icon: <Keyboard className="h-4 w-4" />,
    title: "キーボード",
    items: [
      {
        label: "Cmd + /",
        description: "このチートシートの開閉",
        voice: "「使い方」「ヘルプ」「チートシート」",
      },
    ],
  },
];

export function CheatSheet({ isOpen, onClose }: CheatSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm">使い方</SheetTitle>
            <SheetDescription className="sr-only">
              アプリの操作方法
            </SheetDescription>
            <Kbd className="text-[10px]">Cmd + /</Kbd>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-5 px-5 py-4">
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
