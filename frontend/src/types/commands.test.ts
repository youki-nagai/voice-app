import { describe, expect, it } from "vitest";
import { detectAppCommand, detectModelCommand } from "./commands";

describe("detectModelCommand", () => {
  it("detects opus command", () => {
    expect(detectModelCommand("opusに切り替えて")).toBe("claude-opus-4-6");
    expect(detectModelCommand("オーパスにして")).toBe("claude-opus-4-6");
    expect(detectModelCommand("オパスにして")).toBe("claude-opus-4-6");
  });

  it("detects sonnet command", () => {
    expect(detectModelCommand("sonnetに切り替えて")).toBe("claude-sonnet-4-6");
    expect(detectModelCommand("ソネットにして")).toBe("claude-sonnet-4-6");
    expect(detectModelCommand("そねにして")).toBe("claude-sonnet-4-6");
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

    it("detects 'チャット作って'", () => {
      expect(detectAppCommand("チャット作って")).toEqual({
        type: "new-session",
      });
    });

    it("detects 'チャットを開いて'", () => {
      expect(detectAppCommand("チャットを開いて")).toEqual({
        type: "new-session",
      });
    });

    it("detects '新しいセッション'", () => {
      expect(detectAppCommand("新しいセッションを作って")).toEqual({
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

    it("detects 'チャットを次'", () => {
      expect(detectAppCommand("チャットを次に")).toEqual({
        type: "switch-session",
        target: "next",
      });
    });

    it("detects 'チャットを前'", () => {
      expect(detectAppCommand("チャットを前に")).toEqual({
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

    it("detects '操作方法'", () => {
      expect(detectAppCommand("操作方法を教えて")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });

    it("detects 'ショートカット'", () => {
      expect(detectAppCommand("ショートカット表示")).toEqual({
        type: "toggle-cheat-sheet",
      });
    });
  });

  describe("split", () => {
    it("detects 'ペイン分割して'", () => {
      expect(detectAppCommand("ペイン分割して")).toEqual({ type: "split" });
    });

    it("detects 'ペインわけて'", () => {
      expect(detectAppCommand("ペインわけて")).toEqual({ type: "split" });
    });

    it("detects '画面分割して'", () => {
      expect(detectAppCommand("画面分割して")).toEqual({ type: "split" });
    });

    it("detects '分割して'", () => {
      expect(detectAppCommand("分割して")).toEqual({ type: "split" });
    });

    it("detects 'パネル分割'", () => {
      expect(detectAppCommand("パネル分割して")).toEqual({ type: "split" });
    });
  });

  describe("unsplit", () => {
    it("detects '分割やめて'", () => {
      expect(detectAppCommand("分割やめて")).toEqual({ type: "unsplit" });
    });

    it("detects '1つに戻して'", () => {
      expect(detectAppCommand("1つに戻して")).toEqual({ type: "unsplit" });
    });

    it("detects 'ひとつに戻して'", () => {
      expect(detectAppCommand("ひとつに戻して")).toEqual({ type: "unsplit" });
    });

    it("detects '一つに戻して'", () => {
      expect(detectAppCommand("一つに戻して")).toEqual({ type: "unsplit" });
    });

    it("detects '分割解除'", () => {
      expect(detectAppCommand("分割解除して")).toEqual({ type: "unsplit" });
    });
  });

  describe("focus-panel", () => {
    it("detects 'パネル1'", () => {
      expect(detectAppCommand("パネル1")).toEqual({
        type: "focus-panel",
        index: 1,
      });
    });

    it("detects 'パネル2にフォーカス'", () => {
      expect(detectAppCommand("パネル2にフォーカス")).toEqual({
        type: "focus-panel",
        index: 2,
      });
    });

    it("detects 'ペイン3'", () => {
      expect(detectAppCommand("ペイン3")).toEqual({
        type: "focus-panel",
        index: 3,
      });
    });

    it("detects full-width digit 'パネル２'", () => {
      expect(detectAppCommand("パネル２")).toEqual({
        type: "focus-panel",
        index: 2,
      });
    });
  });

  describe("close-panel", () => {
    it("detects 'パネル2閉じて'", () => {
      expect(detectAppCommand("パネル2閉じて")).toEqual({
        type: "close-panel",
        index: 2,
      });
    });

    it("detects 'ペイン1閉じて'", () => {
      expect(detectAppCommand("ペイン1閉じて")).toEqual({
        type: "close-panel",
        index: 1,
      });
    });

    it("detects 'パネル閉じて' (no index)", () => {
      expect(detectAppCommand("パネル閉じて")).toEqual({
        type: "close-panel",
      });
    });

    it("detects 'このパネル閉じて'", () => {
      expect(detectAppCommand("このパネル閉じて")).toEqual({
        type: "close-panel",
      });
    });

    it("detects 'ペインとじて'", () => {
      expect(detectAppCommand("ペインとじて")).toEqual({
        type: "close-panel",
      });
    });
  });

  describe("select-thread", () => {
    it("detects 'スレッド1'", () => {
      expect(detectAppCommand("スレッド1")).toEqual({
        type: "select-thread",
        index: 1,
      });
    });

    it("detects 'スレッド3を開いて'", () => {
      expect(detectAppCommand("スレッド3を開いて")).toEqual({
        type: "select-thread",
        index: 3,
      });
    });

    it("detects full-width digit 'スレッド２'", () => {
      expect(detectAppCommand("スレッド２")).toEqual({
        type: "select-thread",
        index: 2,
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
