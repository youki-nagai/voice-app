import { Input } from "@/components/ui/input";

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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Input
      type="text"
      className="flex-1 border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
    />
  );
}
