from unittest.mock import AsyncMock, MagicMock

import pytest

from app.voice.classifier import VoiceCommandClassifier


def _make_client(response_text: str) -> MagicMock:
    client = MagicMock()
    content_block = MagicMock()
    content_block.text = response_text
    response = MagicMock()
    response.content = [content_block]
    client.messages.create = AsyncMock(return_value=response)
    return client


class TestVoiceCommandClassifier:
    @pytest.mark.asyncio
    async def test_given_model_command_when_classify_then_returns_model_result(self):
        client = _make_client('{"command": "switch-model-opus", "params": {}}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("オーパスに切り替えて")

        assert result.is_command is True
        assert result.command_type == "model"
        assert result.command == {"type": "switch-model-opus", "model_id": "claude-opus-4-6"}

    @pytest.mark.asyncio
    async def test_given_sonnet_command_when_classify_then_returns_sonnet(self):
        client = _make_client('{"command": "switch-model-sonnet", "params": {}}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("ソネットにして")

        assert result.is_command is True
        assert result.command_type == "model"
        assert result.command["model_id"] == "claude-sonnet-4-6"

    @pytest.mark.asyncio
    async def test_given_app_command_when_classify_then_returns_app_result(self):
        client = _make_client('{"command": "new-session", "params": {}}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("新しいチャットを作って")

        assert result.is_command is True
        assert result.command_type == "app"
        assert result.command == {"type": "new-session"}

    @pytest.mark.asyncio
    async def test_given_switch_session_when_classify_then_includes_target(self):
        client = _make_client('{"command": "switch-session", "params": {"target": 2}}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("チャット2に切り替えて")

        assert result.is_command is True
        assert result.command == {"type": "switch-session", "target": 2}

    @pytest.mark.asyncio
    async def test_given_silence_delay_when_classify_then_includes_seconds(self):
        client = _make_client('{"command": "set-silence-delay", "params": {"seconds": 3}}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("待ち時間3秒にして")

        assert result.is_command is True
        assert result.command == {"type": "set-silence-delay", "seconds": 3}

    @pytest.mark.asyncio
    async def test_given_none_command_when_classify_then_returns_not_command(self):
        client = _make_client('{"command": "none"}')
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("Pythonでフィボナッチ関数を書いて")

        assert result.is_command is False
        assert result.command is None

    @pytest.mark.asyncio
    async def test_given_invalid_json_when_classify_then_returns_not_command(self):
        client = _make_client("これはJSONではありません")
        classifier = VoiceCommandClassifier(client=client)

        result = await classifier.classify("テスト")

        assert result.is_command is False

    @pytest.mark.asyncio
    async def test_given_api_error_when_classify_then_raises(self):
        client = MagicMock()
        client.messages.create = AsyncMock(side_effect=RuntimeError("API error"))
        classifier = VoiceCommandClassifier(client=client)

        with pytest.raises(RuntimeError, match="API error"):
            await classifier.classify("テスト")
