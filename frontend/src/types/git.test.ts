import { describe, it, expect } from 'vitest';
import { detectGitCommand, detectModelCommand, extractBranchName } from './git';

describe('detectGitCommand', () => {
  it('detects git check command', () => {
    expect(detectGitCommand('git確認')).toBe('check');
    expect(detectGitCommand('gitチェック')).toBe('check');
    expect(detectGitCommand('ギット確認')).toBe('check');
  });

  it('detects push command', () => {
    expect(detectGitCommand('プッシュして')).toBe('push');
    expect(detectGitCommand('pushして')).toBe('push');
    expect(detectGitCommand('コードをプッシュ')).toBe('push');
  });

  it('detects PR command', () => {
    expect(detectGitCommand('pr作成')).toBe('pr');
    expect(detectGitCommand('プルリクエスト作成')).toBe('pr');
    expect(detectGitCommand('プルリク出して')).toBe('pr');
  });

  it('detects branch command', () => {
    expect(detectGitCommand('ブランチ作成')).toBe('branch');
    expect(detectGitCommand('新しいブランチ')).toBe('branch');
  });

  it('detects log command', () => {
    expect(detectGitCommand('gitログ')).toBe('log');
    expect(detectGitCommand('コミット履歴')).toBe('log');
  });

  it('detects status command', () => {
    expect(detectGitCommand('git status')).toBe('status');
    expect(detectGitCommand('変更ファイル')).toBe('status');
  });

  it('returns null for non-git text', () => {
    expect(detectGitCommand('こんにちは')).toBeNull();
    expect(detectGitCommand('コードを書いて')).toBeNull();
  });

  it('handles full-width characters', () => {
    expect(detectGitCommand('ｇｉｔ確認')).toBe('check');
  });
});

describe('detectModelCommand', () => {
  it('detects opus command', () => {
    expect(detectModelCommand('opusに切り替えて')).toBe('claude-opus-4-6');
    expect(detectModelCommand('オーパスにして')).toBe('claude-opus-4-6');
  });

  it('detects sonnet command', () => {
    expect(detectModelCommand('sonnetに切り替えて')).toBe('claude-sonnet-4-6');
    expect(detectModelCommand('ソネットにして')).toBe('claude-sonnet-4-6');
  });

  it('returns null for unrelated text', () => {
    expect(detectModelCommand('こんにちは')).toBeNull();
  });
});

describe('extractBranchName', () => {
  it('extracts branch name from text', () => {
    expect(extractBranchName('ブランチ名feature/loginで作って')).toBe('feature/login');
  });

  it('returns timestamp-based name when no pattern matches', () => {
    const result = extractBranchName('ブランチを切って');
    expect(result).toMatch(/^feature\/voice-\d{8}-\d{4}$/);
  });
});
