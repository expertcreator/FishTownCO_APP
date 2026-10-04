const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const brandDir = path.join("assets", "branding", "fishtownco");
const resDir = path.join("android", "app", "src", "main", "res");
const CREAM = [0xf3, 0xeb, 0xdd];

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function writePng(file, png) {
  fs.writeFileSync(file, PNG.sync.write(png));
}

function stripBlackPlate(png) {
  const next = new PNG({ width: png.width, height: png.height });
  next.data = Buffer.from(png.data);
  let cleared = 0;
  for (let i = 0; i < next.data.length; i += 4) {
    const r = next.data[i];
    const g = next.data[i + 1];
    const b = next.data[i + 2];
    const a = next.data[i + 3];
    if (a > 0 && r <= 2 && g <= 2 && b <= 2) {
      next.data[i + 3] = 0;
      cleared += 1;
    }
  }
  return { png: next, cleared };
}

function resize(src, size) {
  const dst = new PNG({ width: size, height: size });
  const sx = src.width / size;
  const sy = src.height / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      const y0 = Math.floor(y * sy);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let yy = y0; yy < y1 && yy < src.height; yy += 1) {
        for (let xx = x0; xx < x1 && xx < src.width; xx += 1) {
          const i = (src.width * yy + xx) << 2;
          const pa = src.data[i + 3] / 255;
          r += src.data[i] * pa;
          g += src.data[i + 1] * pa;
          b += src.data[i + 2] * pa;
          a += pa;
          n += 1;
        }
      }
      const o = (size * y + x) << 2;
      if (n === 0 || a === 0) {
        dst.data[o + 3] = 0;
        continue;
      }
      dst.data[o] = Math.round(r / a);
      dst.data[o + 1] = Math.round(g / a);
      dst.data[o + 2] = Math.round(b / a);
      dst.data[o + 3] = Math.round((a / n) * 255);
    }
  }
  return dst;
}

function compositeCream(src) {
  const dst = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.data.length; i += 4) {
    const a = src.data[i + 3] / 255;
    dst.data[i] = Math.round(src.data[i] * a + CREAM[0] * (1 - a));
    dst.data[i + 1] = Math.round(src.data[i + 1] * a + CREAM[1] * (1 - a));
    dst.data[i + 2] = Math.round(src.data[i + 2] * a + CREAM[2] * (1 - a));
    dst.data[i + 3] = 255;
  }
  return dst;
}

function countOpaque(png) {
  let opaque = 0;
  let black = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (png.width * y + x) << 2;
      const a = png.data[i + 3];
      if (a < 16) continue;
      opaque += 1;
      if (png.data[i] <= 2 && png.data[i + 1] <= 2 && png.data[i + 2] <= 2) black += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { opaque, black, box: [minX, minY, maxX - minX + 1, maxY - minY + 1] };
}

const icon = readPng(path.join(brandDir, "icon.png"));
const stripped = stripBlackPlate(icon);
writePng(path.join(brandDir, "icon.png"), stripped.png);
writePng(path.join(brandDir, "adaptive-icon.png"), stripped.png);
writePng(path.join(brandDir, "favicon.png"), resize(stripped.png, 48));

const densities = {
  mdpi: { legacy: 48, foreground: 108 },
  hdpi: { legacy: 72, foreground: 162 },
  xhdpi: { legacy: 96, foreground: 216 },
  xxhdpi: { legacy: 144, foreground: 324 },
  xxxhdpi: { legacy: 192, foreground: 432 },
};

for (const [density, sizes] of Object.entries(densities)) {
  const dir = path.join(resDir, `mipmap-${density}`);
  const foreground = resize(stripped.png, sizes.foreground);
  const legacy = compositeCream(resize(stripped.png, sizes.legacy));
  for (const name of ["ic_launcher_foreground", "ic_launcher_monochrome"]) {
    fs.rmSync(path.join(dir, `${name}.webp`), { force: true });
    writePng(path.join(dir, `${name}.png`), foreground);
  }
  for (const name of ["ic_launcher", "ic_launcher_round"]) {
    fs.rmSync(path.join(dir, `${name}.webp`), { force: true });
    writePng(path.join(dir, `${name}.png`), legacy);
  }
}

console.log("cleared", stripped.cleared);
console.log("icon", countOpaque(stripped.png));
console.log("favicon", countOpaque(readPng(path.join(brandDir, "favicon.png"))));
