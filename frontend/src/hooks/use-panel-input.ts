import { useCallback, useState } from "react";

export interface PanelInputState {
  textValue: string;
  setTextValue: (value: string) => void;
  pendingImages: string[];
  setPendingImages: React.Dispatch<React.SetStateAction<string[]>>;
  clearAndGetInput: () => { text: string; images: string[] } | null;
}

export function usePanelInput(): PanelInputState {
  const [textValue, setTextValue] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const clearAndGetInput = useCallback((): {
    text: string;
    images: string[];
  } | null => {
    if (!textValue.trim()) return null;
    const result = { text: textValue, images: [...pendingImages] };
    setTextValue("");
    setPendingImages([]);
    return result;
  }, [textValue, pendingImages]);

  return {
    textValue,
    setTextValue,
    pendingImages,
    setPendingImages,
    clearAndGetInput,
  };
}
