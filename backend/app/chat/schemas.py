from dataclasses import dataclass, field


@dataclass
class FileChange:
    path: str
    content: str
    action: str  # "create" | "update" | "delete"


@dataclass
class CodeGenerationResult:
    explanation: str
    file_changes: list[FileChange] = field(default_factory=list)
