import { describe, expect, it } from "vitest";
import { detectModelCommand } from "./commands";

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
