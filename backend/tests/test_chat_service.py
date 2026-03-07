from app.chat.service import ChatService


class TestChatServiceParseResponse:
    def test_given_valid_json_when_parse_then_returns_result(self):
        text = (
            '{"explanation": "テスト", "file_changes": '
            '[{"path": "test.py", "content": "print(1)", "action": "create"}]}'
        )
        result = ChatService.parse_response(text)

        assert result.explanation == "テスト"
        assert len(result.file_changes) == 1
        assert result.file_changes[0].path == "test.py"
        assert result.file_changes[0].action == "create"

    def test_given_json_in_code_block_when_parse_then_extracts_json(self):
        text = '```json\n{"explanation": "テスト", "file_changes": []}\n```'
        result = ChatService.parse_response(text)

        assert result.explanation == "テスト"
        assert result.file_changes == []

    def test_given_invalid_json_when_parse_then_returns_raw_text(self):
        text = "これはJSONではありません"
        result = ChatService.parse_response(text)

        assert result.explanation == text
        assert result.file_changes == []

    def test_given_no_file_changes_when_parse_then_returns_empty_list(self):
        text = '{"explanation": "回答のみ"}'
        result = ChatService.parse_response(text)

        assert result.explanation == "回答のみ"
        assert result.file_changes == []

    def test_given_text_before_json_when_parse_then_extracts_json(self):
        text = (
            "タイトルを変更します。\n\n"
            '{"explanation": "タイトル変更", "file_changes": '
            '[{"path": "index.html", "content": "<h1>v2</h1>", "action": "update"}]}'
        )
        result = ChatService.parse_response(text)

        assert result.explanation == "タイトル変更"
        assert len(result.file_changes) == 1
        assert result.file_changes[0].path == "index.html"
        assert result.file_changes[0].action == "update"
