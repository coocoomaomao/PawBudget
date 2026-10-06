const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function main() {
  const root = path.join(__dirname, '..');
  const svgPath = path.join(root, 'build', 'icon.svg');
  const pngPath = path.join(root, 'build', 'icon.png');
  const icoPath = path.join(root, 'build', 'icon.ico');

  await sharp(svgPath)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const frames = [];
  for (const size of sizes) {
    frames.push(await sharp(svgPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer());
  }

  const ico = await pngToIco(frames);
  fs.writeFileSync(icoPath, ico);
  console.log('Generated:', pngPath, icoPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
