const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputImage = 'D:/POS/icon.jpg';
const outputDir = './src-tauri/icons';

async function generateIcons() {
  console.log('Generating icons from:', inputImage);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PNG icons at different sizes
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
  ];

  for (const { name, size } of sizes) {
    await sharp(inputImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`Created: ${name}`);
  }

  // Generate 256x256 for ICO
  const icoBuffer = await sharp(inputImage)
    .resize(256, 256)
    .png()
    .toBuffer();

  // Create ICO file
  const ico = await pngToIco(icoBuffer);
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), ico);
  console.log('Created: icon.ico');

  // For macOS, we'll create a simple ICNS placeholder (proper ICNS needs additional tools)
  // Copy 256x256 as icns placeholder
  await sharp(inputImage)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  console.log('Created: icon.png (for ICNS reference)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
