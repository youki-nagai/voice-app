import { useCallback } from "react";
import { extractBranchName } from "../types/git";

interface UseGitCommandsOptions {
  addMessage: (text: string, type: "system" | "error") => void;
  checkGitStatus: () => Promise<string | null>;
}

function formatError(prefix: string, e: unknown): string {
  return `${prefix}: ${e instanceof Error ? e.message : String(e)}`;
}

export function useGitCommands({
  addMessage,
  checkGitStatus,
}: UseGitCommandsOptions) {
  const executeGitCommand = useCallback(
    async (action: string, originalText: string) => {
      switch (action) {
        case "check": {
          const detail = await checkGitStatus();
          if (detail) {
            addMessage(detail, "system");
          } else {
            addMessage("Git状態の取得に失敗しました", "error");
          }
          break;
        }
        case "push": {
          try {
            const r = await fetch("/api/git/push", { method: "POST" });
            const data = await r.json();
            if (data.success) {
              addMessage(`push完了: ${data.output || "OK"}`, "system");
            } else {
              addMessage(`push失敗: ${data.error}`, "error");
            }
            await checkGitStatus();
          } catch (e) {
            addMessage(formatError("pushエラー", e), "error");
          }
          break;
        }
        case "pr": {
          try {
            const logRes = await fetch("/api/git/log");
            const logData = await logRes.json();
            const title =
              logData.log?.length > 0
                ? logData.log[0].replace(/^[a-f0-9]+\s+/, "")
                : originalText;
            const r = await fetch("/api/git/pr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                body: `音声入力: ${originalText}`,
              }),
            });
            const data = await r.json();
            if (data.success) {
              addMessage(`PR作成完了: ${data.url}`, "system");
            } else {
              addMessage(`PR作成失敗: ${data.error}`, "error");
            }
          } catch (e) {
            addMessage(formatError("PR作成エラー", e), "error");
          }
          break;
        }
        case "branch": {
          const branchName = extractBranchName(originalText);
          try {
            const r = await fetch("/api/git/branch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: branchName }),
            });
            const data = await r.json();
            if (data.success) {
              addMessage(`ブランチ作成完了: ${data.branch}`, "system");
            } else {
              addMessage(`ブランチ作成失敗: ${data.error}`, "error");
            }
            await checkGitStatus();
          } catch (e) {
            addMessage(formatError("ブランチ作成エラー", e), "error");
          }
          break;
        }
        case "log": {
          try {
            const r = await fetch("/api/git/log");
            const data = await r.json();
            if (data.log?.length > 0) {
              addMessage(data.log.join("\n"), "system");
            } else {
              addMessage("コミット履歴がありません", "system");
            }
          } catch (e) {
            addMessage(formatError("ログ取得エラー", e), "error");
          }
          break;
        }
        case "status": {
          try {
            const r = await fetch("/api/git/status");
            const data = await r.json();
            const lines = [`branch: ${data.branch}`];
            if (data.changed_files.length > 0) {
              lines.push(`変更ファイル:\n${data.changed_files.join("\n")}`);
            } else {
              lines.push("変更なし（クリーン）");
            }
            addMessage(lines.join("\n"), "system");
          } catch (e) {
            addMessage(formatError("ステータス取得エラー", e), "error");
          }
          break;
        }
      }
    },
    [addMessage, checkGitStatus],
  );

  return { executeGitCommand };
}
