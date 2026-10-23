// Generates the manifest PNG icons from public/logo.svg.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const logo = await readFile(new URL('../public/logo.svg', import.meta.url));
const output = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;
const BACKGROUND = '#102A43';

for (const size of [192, 512]) {
  await sharp(logo, { density: 600 }).resize(size, size).png().toFile(output(`icon-${size}.png`));
}

// Maskable: logo at 70 % (inside the 80 % safe zone) on the splash background.
const inner = Math.round(512 * 0.7);
const innerLogo = await sharp(logo, { density: 600 }).resize(inner, inner).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: BACKGROUND } })
  .composite([{ input: innerLogo, gravity: 'center' }])
  .png()
  .toFile(output('icon-maskable-512.png'));

await sharp(logo, { density: 600 }).resize(180, 180).flatten({ background: '#FFFFFF' }).png().toFile(output('apple-touch-icon-180.png'));
console.log('Icons generated in public/icons/');
