export type ModelId = "claude-opus-4-6" | "claude-sonnet-4-6";

export type ServerMessageType =
  | "status"
  | "tool_action"
  | "ai_chunk"
  | "ai_done"
  | "test_result"
  | "lint_result"
  | "verify_failed"
  | "commit"
  | "complete"
  | "error"
  | "keepalive";

export type ServerMessage =
  | { type: "status"; text: string }
  | { type: "tool_action"; tool: string; text: string }
  | { type: "ai_chunk"; text: string }
  | { type: "ai_done" }
  | {
      type: "test_result";
      success: boolean;
      passed: number;
      failed: number;
      output?: string;
    }
  | { type: "lint_result"; success: boolean; output?: string }
  | { type: "verify_failed"; text: string }
  | { type: "commit"; message: string }
  | { type: "complete" }
  | { type: "error"; text: string }
  | { type: "keepalive" };

export type ChatMessageType =
  | "user"
  | "ai"
  | "system"
  | "error"
  | "interim"
  | "test-pass"
  | "test-fail"
  | "verify-failed"
  | "commit";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  text: string;
  imageUrl?: string;
}

export interface ToolAction {
  tool: string;
  text: string;
  status: "running" | "done";
}

export interface ActionLog {
  id: string;
  actions: ToolAction[];
  status: "running" | "done";
}

export type TimelineItem =
  | { kind: "message"; data: ChatMessage }
  | { kind: "action-log"; data: ActionLog }
  | { kind: "processing"; id: string; text: string };

export interface GitCheckResult {
  gh_status: {
    gh_installed: boolean;
    gh_authenticated: boolean;
    git_repo: boolean;
    errors: string[];
  };
  repo_info?: {
    remote_url: string;
    current_branch: string;
  };
}
