import { useEffect, useRef } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  placeholder?: string;
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  onPaste,
  placeholder,
}: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-normal text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
      rows={1}
    />
  );
}
