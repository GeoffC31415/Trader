import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import OpenAI from 'openai';
import vm from 'node:vm';

const DEFAULT_SOURCE = path.resolve(process.cwd(), 'src/data/commodity_icon_prompts.ts');
const DEFAULT_OUT = path.resolve(process.cwd(), 'public/icons/commodities/masters');
const DEFAULT_MODEL = 'gpt-image-1';
const DEFAULT_SIZE = '1024x1024';

// Icon style template - clean, consistent, suitable for UI
const STYLE_PROMPT = [
  'Clean icon design for game UI, centered subject on neutral background.',
  'Isometric or 3/4 view, studio lighting, professional product photography style.',
  'High detail, sharp focus, vibrant colors appropriate to the item.',
  'Subtle depth of field, minimal shadows, game asset quality.',
  'Consistent style across set, sci-fi aesthetic.',
  'Icon keyword: TRADE-COMMODITY-ICONS-01.',
  'Output as PNG with transparent or dark neutral background.'
].join(' ');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') args.source = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--size') args.size = argv[++i];
    else if (a === '--dry') args.dry = true;
  }
  return args;
}

function toSafeFilename(name) {
  return name.replace(/[^a-z0-9-_\.\s]/gi, '_').replace(/\s+/g, ' ').trim();
}

async function readPromptsFromTs(filePath) {
  const src = await fs.readFile(filePath, 'utf8');
  const marker = 'export const commodityIconPrompts';
  const startIdx = src.indexOf(marker);
  if (startIdx === -1) throw new Error('Could not find commodityIconPrompts export in TS file');
  const bracketStart = src.indexOf('[', startIdx);
  const bracketEnd = src.indexOf('];', bracketStart);
  if (bracketStart === -1 || bracketEnd === -1) throw new Error('Could not parse commodityIconPrompts array');
  const arrText = src.slice(bracketStart, bracketEnd + 1);
  // Prefer evaluating as JS to avoid brittle JSON transforms
  try {
    const sandbox = {};
    const evaluated = vm.runInNewContext(`(${arrText})`, sandbox, { timeout: 1000 });
    if (!Array.isArray(evaluated)) throw new Error('commodityIconPrompts did not evaluate to an array');
    return evaluated.map((x) => ({ id: x.id, prompt: x.prompt }));
  } catch (e) {
    // Fallback: attempt JSON conversion
    let jsonText = arrText
      .replace(/(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"');
    jsonText = jsonText.replace(/,\s*([\]\}])/g, '$1');
    const arr = JSON.parse(jsonText);
    return arr.map((x) => ({ id: x.id, prompt: x.prompt }));
  }
}

async function readPrompts(sourcePath) {
  const p = sourcePath || DEFAULT_SOURCE;
  const ext = path.extname(p).toLowerCase();
  if (ext === '.json') {
    const txt = await fs.readFile(p, 'utf8');
    const arr = JSON.parse(txt);
    return arr;
  }
  // Assume TS export shape from src/data/commodity_icon_prompts.ts
  return readPromptsFromTs(p);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeImagePng(outDir, id, b64) {
  const file = path.join(outDir, `${toSafeFilename(id)}.png`);
  const buf = Buffer.from(b64, 'base64');
  await fs.writeFile(file, buf);
  return file;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateAll({ source, out, model, size, dry }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY env var is required');
  const openai = new OpenAI({ apiKey });
  const prompts = await readPrompts(source);
  await ensureDir(out);

  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    const { id, prompt } = prompts[i];
    const fullPrompt = [
      `Commodity: ${id.replace(/_/g, ' ')}.`,
      prompt,
      STYLE_PROMPT,
    ].join('\n');
    process.stdout.write(`Generating (${i+1}/${prompts.length}): ${id} ... `);
    if (dry) {
      console.log('[dry-run]');
      results.push({ id, prompt: fullPrompt, file: null });
      continue;
    }
    try {
      const res = await openai.images.generate({ model, prompt: fullPrompt, size, n: 1 });
      const data = res?.data?.[0];
      const b64 = data?.b64_json || data?.b64Json || data?.image || null;
      if (!b64) throw new Error('No image data returned');
      const file = await writeImagePng(out, id, b64);
      console.log('ok');
      results.push({ id, prompt: fullPrompt, file });
      // polite pacing
      await delay(500);
    } catch (err) {
      console.log('error');
      console.error(err?.message || err);
      results.push({ id, prompt: fullPrompt, error: String(err) });
      // simple backoff on error
      await delay(1500);
    }
  }
  const metaFile = path.join(out, 'metadata.json');
  await fs.writeFile(metaFile, JSON.stringify({ model, size, generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');
  console.log(`\nDone. Wrote ${results.filter(r => r.file).length} images to ${out}`);
}

(async () => {
  try {
    const args = parseArgs(process.argv);
    await generateAll({
      source: args.source || DEFAULT_SOURCE,
      out: path.resolve(process.cwd(), args.out || DEFAULT_OUT),
      model: args.model || DEFAULT_MODEL,
      size: args.size || DEFAULT_SIZE,
      dry: !!args.dry,
    });
  } catch (err) {
    console.error(err?.message || err);
    process.exit(1);
  }
})();

