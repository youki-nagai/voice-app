export type ModelId = "claude-opus-4-6" | "claude-sonnet-4-6";

export type ServerMessage =
  | { type: "status"; text: string }
  | { type: "tool_action"; tool: string; text: string }
  | { type: "ai_chunk"; text: string }
  | { type: "ai_done" }
  | { type: "complete" }
  | { type: "error"; text: string }
  | { type: "keepalive" };

export type ChatMessageType = "user" | "ai" | "system" | "error" | "interim";

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
