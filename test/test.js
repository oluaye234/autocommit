const assert = require('assert');
const { heuristicMessage } = require('../src/autocommit.js');

function run() {
  const diff = '+++ b/file.txt\n+hello world\n';
  const files = ['A\tfile.txt'];
  const msg = heuristicMessage(diff, files);
  assert.ok(typeof msg === 'string' && msg.length > 0, 'should generate a commit message');
  assert.ok(/feat|fix|chore|docs|test/.test(msg), 'message should have a conventional-commit type prefix');
  console.log('✔ autocommit tests passed');
}

run();
