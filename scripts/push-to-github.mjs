import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

async function push() {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Usage: node scripts/push-to-github.mjs <GITHUB_PERSONAL_ACCESS_TOKEN>');
    process.exit(1);
  }

  const dir = process.cwd();
  console.log('Pushing main branch to https://github.com/steelburn/RubicClear.git ...');

  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token }),
  });

  console.log('✓ Successfully pushed to GitHub!', pushResult);
}

push().catch(err => {
  console.error('Push failed:', err.message);
  process.exit(1);
});
