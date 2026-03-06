#!/usr/bin/env python3
"""SSE動作確認用のデバッグスクリプト"""

import json
import requests
from datetime import datetime


def test_sse_stream():
    """SSEストリームの動作をテストする"""
    url = "http://localhost:8000/api/voice/stream"
    data = {"text": "こんにちは、テストです"}
    
    print(f"[{datetime.now()}] SSEリクエスト開始")
    print(f"URL: {url}")
    print(f"データ: {json.dumps(data, ensure_ascii=False)}")
    print("-" * 50)
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            stream=True,
            timeout=30
        )
        
        print(f"ステータスコード: {response.status_code}")
        print(f"レスポンスヘッダー:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        print("-" * 50)
        
        if response.status_code != 200:
            print(f"エラー: HTTP {response.status_code}")
            print(response.text)
            return
            
        # ストリーミングデータを受信
        event_count = 0
        for line in response.iter_lines(decode_unicode=True):
            if line:
                print(f"[{datetime.now()}] 受信: {line}")
                
                if line.startswith("data: "):
                    try:
                        event_data = json.loads(line[6:])
                        event_count += 1
                        print(f"  イベント#{event_count}: {event_data['type']}")
                        
                        if event_data['type'] == 'complete':
                            print("\n✅ ストリーム完了")
                            break
                        elif event_data['type'] == 'error':
                            print(f"\n❌ エラー: {event_data['text']}")
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"  JSON解析エラー: {e}")
                        
        print(f"\n受信したイベント数: {event_count}")
        
    except requests.exceptions.Timeout:
        print("❌ タイムアウト")
    except requests.exceptions.ConnectionError:
        print("❌ 接続エラー - サーバーが起動していません")
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")


if __name__ == "__main__":
    test_sse_stream()
