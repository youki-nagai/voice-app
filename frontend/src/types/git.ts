export interface GitCommandPattern {
  patterns: string[];
  action: GitAction;
}

export type GitAction = 'check' | 'push' | 'pr' | 'branch' | 'log' | 'status';

export const GIT_COMMANDS: GitCommandPattern[] = [
  {
    patterns: [
      'git確認', 'git チェック', 'gitチェック',
      'ghコマンド', 'gh コマンド', 'ジーエイチコマンド', 'ジーエッチコマンド',
      'gitステータス', 'git ステータス', 'git状態', 'git 状態',
      'ギット確認', 'ギットチェック', 'ギット状態',
    ],
    action: 'check',
  },
  {
    patterns: [
      'プッシュして', 'pushして', 'push して', 'ぷっしゅして',
      'プッシュする', 'pushする', 'push する',
      'gitpush', 'gitプッシュ', 'ギットプッシュ',
      'コードをプッシュ', 'プッシュお願い',
    ],
    action: 'push',
  },
  {
    patterns: [
      'pr作成', 'pr 作成', 'プルリクエスト作成', 'プルリクエスト 作成',
      'prを作', 'pr を作', 'プルリク作', 'プルリクエストを作',
      'プルリク出', 'プルリクエスト出', 'prを出', 'pr出',
      'ピーアール作', 'ピーアール出',
    ],
    action: 'pr',
  },
  {
    patterns: [
      'ブランチ作成', 'ブランチを作', 'ブランチ 作成',
      'branch作成', 'branch を作', 'ブランチ切',
      'ブランチを切', '新しいブランチ',
    ],
    action: 'branch',
  },
  {
    patterns: [
      'gitログ', 'git ログ', 'git log', 'gitlog',
      'コミットログ', 'コミット履歴', 'コミット一覧',
      'ギットログ', '履歴を見', 'ログを見',
    ],
    action: 'log',
  },
  {
    patterns: [
      'git status', 'ギットステータス',
      '変更ファイル', '変更一覧', '差分確認',
    ],
    action: 'status',
  },
];

export function detectGitCommand(text: string): GitAction | null {
  const normalized = text.trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g,
      s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  for (const cmd of GIT_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (normalized.includes(pattern.replace(/\s+/g, ''))) {
        return cmd.action;
      }
    }
  }
  return null;
}

export function detectModelCommand(text: string): string | null {
  const n = text.trim().toLowerCase().replace(/\s+/g, '');
  const opusPatterns = ['opusに', 'オーパスに', 'おーぱすに', 'オプスに', 'おぷすに'];
  const sonnetPatterns = ['sonnetに', 'ソネットに', 'そねっとに', 'ソネに'];
  for (const p of opusPatterns) { if (n.includes(p)) return 'claude-opus-4-6'; }
  for (const p of sonnetPatterns) { if (n.includes(p)) return 'claude-sonnet-4-6'; }
  return null;
}

export function extractBranchName(text: string): string {
  const match = text.match(/(?:ブランチ名?|branch)\s*[:：]?\s*([a-zA-Z0-9/_-]+)/i);
  if (match) return match[1];
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `feature/voice-${ts}`;
}
