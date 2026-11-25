import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Poly Haven CC0 photographs; runtime serves only the optimized local maps.
const output = path.resolve('public/room');
await fs.mkdir(output, { recursive: true });
const sources = [];
for (const [asset, name] of [['wood_table_worn', 'walnut'], ['white_plaster_02', 'plaster']]) {
  const response = await fetch(`https://api.polyhaven.com/files/${asset}`);
  if (!response.ok) throw new Error(`Material metadata: ${response.status}`);
  const files = await response.json();
  await Promise.all([['Diffuse', 'color'], ['nor_gl', 'normal'], ['Rough', 'roughness']].map(async ([kind, suffix]) => {
    const source = files[kind]['1k'].jpg;
    const download = await fetch(source.url);
    if (!download.ok) throw new Error(`Material download: ${download.status}`);
    const bytes = Buffer.from(await download.arrayBuffer());
    const filename = `${name}-${suffix}.webp`;
    await sharp(bytes).webp({ quality: suffix === 'normal' ? 95 : 88 }).toFile(path.join(output, filename));
    sources.push({ filename, asset, source: source.url, license: 'CC0-1.0' });
  }));
}
await fs.writeFile(path.join(output, 'sources.json'), JSON.stringify(sources, null, 2) + '\n');
await fs.writeFile(path.join(output, 'LICENSE.txt'), 'Photographed PBR maps from Poly Haven, CC0 1.0.\nhttps://polyhaven.com/license\nhttps://polyhaven.com/a/wood_table_worn\nhttps://polyhaven.com/a/white_plaster_02\nOptimized locally to 1024px WebP. See sources.json for original map URLs.\n');
console.log('Prepared six local photographed material maps.');
