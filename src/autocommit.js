#!/usr/bin/env node
/**
 * autocommit — generates meaningful git commit messages from staged diffs.
 *
 * Works offline using a heuristic summarizer, or with a real LLM if you set
 * ANTHROPIC_API_KEY. Never commits without your confirmation unless --yes is passed.
 *
 * Usage:
 *   git add <files>
 *   node src/autocommit.js               # suggest a message, ask to commit
 *   node src/autocommit.js --dry-run     # only print the suggested message
 *   node src/autocommit.js --yes         # commit automatically with the suggestion
 */

const { execSync } = require('child_process');
const readline = require('readline');

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

function getStagedDiff() {
  try {
    return sh('git diff --staged --unified=0 --no-color');
  } catch (e) {
    console.error('Not a git repository, or git is not available.');
    process.exit(1);
  }
}

function getStagedFiles() {
  try {
    return sh('git diff --staged --name-status').trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** Heuristic, offline commit-message generator (Conventional Commits style). */
function heuristicMessage(diff, files) {
  if (!diff.trim()) return null;

  const stats = { added: 0, modified: 0, deleted: 0, renamed: 0 };
  const changedPaths = [];
  for (const line of files) {
    const [status, ...rest] = line.split('\t');
    const filePath = rest[rest.length - 1];
    changedPaths.push(filePath);
    if (status.startsWith('A')) stats.added++;
    else if (status.startsWith('M')) stats.modified++;
    else if (status.startsWith('D')) stats.deleted++;
    else if (status.startsWith('R')) stats.renamed++;
  }

  let type = 'chore';
  if (/test|spec/i.test(changedPaths.join(' '))) type = 'test';
  else if (/readme|docs\//i.test(changedPaths.join(' '))) type = 'docs';
  else if (stats.added > 0 && stats.modified === 0) type = 'feat';
  else if (stats.deleted > 0 && stats.added === 0 && stats.modified === 0) type = 'chore';
  else if (stats.modified > 0) type = 'fix';

  const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
  const removedLines = (diff.match(/^-[^-]/gm) || []).length;

  const scopeGuess = changedPaths.length === 1
    ? changedPaths[0].split('/').slice(0, -1).pop() || changedPaths[0]
    : `${changedPaths.length} files`;

  const summaryParts = [];
  if (stats.added) summaryParts.push(`add ${stats.added} file(s)`);
  if (stats.modified) summaryParts.push(`update ${stats.modified} file(s)`);
  if (stats.deleted) summaryParts.push(`remove ${stats.deleted} file(s)`);
  if (stats.renamed) summaryParts.push(`rename ${stats.renamed} file(s)`);

  const subject = `${type}(${scopeGuess}): ${summaryParts.join(', ') || 'update code'}`;
  const body = [
    '',
    `Changed files: ${changedPaths.join(', ')}`,
    `Diff stats: +${addedLines} / -${removedLines} lines`,
  ].join('\n');

  return `${subject}\n${body}`;
}

async function llmMessage(diff) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a single Conventional Commits style commit message (subject + optional short body) for this staged git diff. Only output the commit message, nothing else.\n\n${diff.slice(0, 6000)}`,
        }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || '').join('\n').trim();
    return text || null;
  } catch {
    return null;
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoYes = args.includes('--yes');

  const diff = getStagedDiff();
  if (!diff.trim()) {
    console.log('No staged changes found. Stage something first: git add <files>');
    process.exit(0);
  }
  const files = getStagedFiles();

  let message = await llmMessage(diff);
  let source = 'AI (Claude)';
  if (!message) {
    message = heuristicMessage(diff, files);
    source = 'heuristic (offline)';
  }

  console.log(`\n📝 Suggested commit message (via ${source}):\n`);
  console.log('----------------------------------------');
  console.log(message);
  console.log('----------------------------------------\n');

  if (dryRun) return;

  if (autoYes) {
    sh(`git commit -m ${JSON.stringify(message)}`);
    console.log('✔ Committed.');
    return;
  }

  const answer = await ask('Commit with this message? [y/N/e=edit] ');
  if (/^y/i.test(answer)) {
    sh(`git commit -m ${JSON.stringify(message)}`);
    console.log('✔ Committed.');
  } else if (/^e/i.test(answer)) {
    const edited = await ask('Enter your own message: ');
    sh(`git commit -m ${JSON.stringify(edited)}`);
    console.log('✔ Committed with your edited message.');
  } else {
    console.log('Not committing. Message left above for you to copy if needed.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { heuristicMessage, getStagedDiff, getStagedFiles };
