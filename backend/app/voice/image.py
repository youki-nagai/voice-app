import base64
import tempfile
from pathlib import Path

_MIME_EXT_MAP = {"jpeg": "jpg", "svg+xml": "svg"}


def save_image(image_data_url: str) -> Path:
    """data:image/xxx;base64,... 形式の画像を一時ファイルに保存してパスを返す。"""
    header, encoded = image_data_url.split(",", 1)
    mime = header.split(";")[0].split("/")[1]
    ext = _MIME_EXT_MAP.get(mime, mime)
    tmp = tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False)
    tmp.write(base64.b64decode(encoded))
    tmp.close()
    return Path(tmp.name)


def build_prompt(instruction: str, image_paths: list[Path] | None) -> str:
    if not image_paths:
        return instruction
    paths_str = " ".join(str(p) for p in image_paths)
    return f"{instruction}\n\n添付画像: {paths_str}"
