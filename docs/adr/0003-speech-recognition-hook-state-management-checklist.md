# 0003. 音声認識フック変更時のステート管理チェックリスト

Date: 2026-03-08

## Status

Accepted

## Context

音声認識フック（useSpeechRecognition）で4回の修正が発生した:

- `da1874b` 音声認識のstale closureによるぶちぶち送信を修正
- `d6ed7d4` 音声完了後にinterimTextがクリアされずユーザーメッセージが重複表示されるバグを修正
- `50802ef` ブラウザ非アクティブ時に音声入力を停止する
- `b4f8217` ブラウザ非アクティブ時にblur/focusイベントで音声入力を停止する

根本問題: Web Speech APIのイベントドリブンな挙動とReactのステート管理（useRef/useState/useCallback）の組み合わせが複雑で、副作用の全パターンを事前に把握できなかった。特にブラウザ非アクティブ対応は同じ問題を2回修正している（矛盾修正）。

## Decision

音声認識フック（useSpeechRecognition）を変更する際は、以下のチェックリストを確認する:

1. **Stale closure**: コールバック内で参照するステートがuseRefで最新値を保持しているか
2. **クリーンアップ**: 音声停止時にinterimText等の一時ステートが確実にクリアされるか
3. **ブラウザライフサイクル**: blur/focus/visibilitychangeイベントで音声入力が適切に停止・再開されるか
4. **イベントリスナーの登録・解除**: useEffect内でaddEventListenerしたものがcleanupで確実にremoveされるか
5. **競合状態**: start/stopが短時間に連続呼び出しされた場合に不整合が起きないか

## Consequences

- メリット: 音声認識フックの変更時に見落としやすい副作用を事前にキャッチできる
- メリット: 同じ種類のバグ（stale closure、クリア漏れ）の再発を防止
- デメリット: チェックリストの維持コスト（Web Speech API仕様変更時に更新が必要）
- useSpeechRecognitionフックを変更する場合は、本ADRを参照すること
