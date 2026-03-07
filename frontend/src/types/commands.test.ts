import { describe, expect, it } from "vitest";
import { detectAppCommand, detectModelCommand } from "./commands";

describe("detectModelCommand", () => {
  it("detects opus command", () => {
    expect(detectModelCommand("opusに切り替えて")).toBe("claude-opus-4-6");
    expect(detectModelCommand("オーパスにして")).toBe("claude-opus-4-6");
  });

  it("detects sonnet command", () => {
    expect(detectModelCommand("sonnetに切り替えて")).toBe("claude-sonnet-4-6");
    expect(detectModelCommand("ソネットにして")).toBe("claude-sonnet-4-6");
  });

  it("returns null for unrelated text", () => {
    expect(detectModelCommand("こんにちは")).toBeNull();
  });
});

describe("detectAppCommand", () => {
  describe("new-session", () => {
    it("detects '新しいチャット'", () => {
      expect(detectAppCommand("新しいチャットを作って")).toEqual({
        type: "new-session",
      });
    });

    it("detects '新規チャット'", () => {
      expect(detectAppCommand("新規チャット")).toEqual({
        type: "new-session",
      });
    });

    it("detects 'チャット追加'", () => {
      expect(detectAppCommand("チャット追加して")).toEqual({
        type: "new-session",
      });
    });

    it("detects 'チャットを追加'", () => {
      expect(detectAppCommand("チャットを追加")).toEqual({
        type: "new-session",
      });
    });
  });

  describe("switch-session", () => {
    it("detects 'チャット1に切り替えて'", () => {
      expect(detectAppCommand("チャット1に切り替えて")).toEqual({
        type: "switch-session",
        target: 1,
      });
    });

    it("detects 'チャット2に'", () => {
      expect(detectAppCommand("チャット2にして")).toEqual({
        type: "switch-session",
        target: 2,
      });
    });

    it("detects 'チャット３に' (full-width)", () => {
      expect(detectAppCommand("チャット３に切り替え")).toEqual({
        type: "switch-session",
        target: 3,
      });
    });

    it("detects '次のチャット'", () => {
      expect(detectAppCommand("次のチャットに切り替えて")).toEqual({
        type: "switch-session",
        target: "next",
      });
    });

    it("detects '前のチャット'", () => {
      expect(detectAppCommand("前のチャットにして")).toEqual({
        type: "switch-session",
        target: "prev",
      });
    });
  });

  describe("toggle-cheat-sheet", () => {
    it("detects '使い方'", () => {
      expect(detectAppCommand("使い方を表示して")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });

    it("detects 'ヘルプ'", () => {
      expect(detectAppCommand("ヘルプ表示")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });

    it("detects 'チートシート'", () => {
      expect(detectAppCommand("チートシートを開いて")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });

    it("detects 'チートシートを閉じて'", () => {
      expect(detectAppCommand("チートシート閉じて")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });
  });

  it("returns null for unrelated text", () => {
    expect(detectAppCommand("ボタンの色を赤にして")).toBeNull();
  });

  it("returns null for normal AI instructions", () => {
    expect(detectAppCommand("この関数をリファクタリングして")).toBeNull();
  });
});
