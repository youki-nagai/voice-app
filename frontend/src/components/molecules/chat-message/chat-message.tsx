import { cn } from "@/lib/utils";
import type { ChatMessageType } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";

interface ChatMessageProps {
  type: ChatMessageType;
  text: string;
  imageUrl?: string;
  isProcessing?: boolean;
}

const typeStyles: Record<ChatMessageType, string> = {
  user: "bg-blue-950 self-end text-blue-200",
  interim: "bg-blue-950/70 self-end text-blue-300/70 italic",
  ai: "bg-indigo-950 self-start text-indigo-200",
  system: "bg-green-950 self-center text-green-300 text-xs text-center",
  error: "bg-red-950 self-center text-red-300 text-xs",
  commit: "bg-yellow-950 self-center text-yellow-300 text-xs font-mono",
  "test-pass": "bg-green-950 self-center text-green-300 text-xs font-mono",
  "test-fail": "bg-red-950 self-center text-red-300 text-xs font-mono",
  "verify-failed": "bg-red-950 self-center text-orange-300 text-xs font-bold",
};

export function ChatMessage({
  type,
  text,
  imageUrl,
  isProcessing,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words max-w-[85%]",
        typeStyles[type],
      )}
    >
      {isProcessing && <Spinner />}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="添付画像"
          className="mb-2 max-h-48 rounded-md"
        />
      )}
      <span>{text}</span>
    </div>
  );
}
