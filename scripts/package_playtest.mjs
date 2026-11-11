// Release from a clean revision only. Requires Node 20+, npm, Chromium and tar.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const assertClean = () => {
  if (git('status', '--porcelain', '--untracked-files=all')) {
    throw new Error('Playtest packaging requires a clean checkout. Commit intended changes, or use a separate clean worktree; do not discard unrelated work.');
  }
};
async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
async function listFiles(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(join(dir, entry.name), relative + '/'));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported build entry: ${relative}`);
  }
  return files.sort();
}

try {
  assertClean();
  const revision = git('rev-parse', 'HEAD');
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run through npm run playtest:package.');
  execFileSync(process.execPath, [npm, 'run', 'playtest:check'], {
    cwd: root, stdio: 'inherit', env: { ...process.env, CI: '1' },
  });
  assertClean();
  if (git('rev-parse', 'HEAD') !== revision) throw new Error('Revision changed during validation.');
  const dist = join(root, 'dist');
  for (const doc of ['PLAYTEST.md', 'PLAYER_FEEDBACK_ALPHA_2.md', 'OPEN_WORLD_JOURNAL.md']) {
    await copyFile(join(root, 'docs', doc), join(dist, doc));
  }
  const files = {};
  for (const file of await listFiles(dist)) files[file] = await digest(join(dist, file));
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const metadata = {
    version, revision, commitDate: git('show', '-s', '--format=%cI', revision),
    nodeVersion: process.version, lockfileSha256: await digest(join(root, 'package-lock.json')),
    checks: ['typecheck', 'unit/DOM/integration', 'production build', 'development browser smoke', 'production tutorial/checkpoint smoke'],
    files,
  };
  await writeFile(join(dist, 'playtest-build.json'), JSON.stringify(metadata, null, 2) + '\n');
  const outputDir = join(root, 'artifacts');
  await mkdir(outputDir, { recursive: true });
  const name = `trader-alpha-${revision.slice(0, 12)}.tar.gz`;
  const archive = join(outputDir, name);
  execFileSync('tar', ['-czf', archive, '-C', dist, '.'], { stdio: 'inherit' });
  await writeFile(archive + '.sha256', `${await digest(archive)}  ${name}\n`);
  console.log(`\nReady for focused alpha testing: ${archive}\nExtract, serve over HTTP, and follow PLAYTEST.md. Not a human playtest or performance certification.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
