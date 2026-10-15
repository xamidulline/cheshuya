import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
// Derived only from the existing 600px variants; original art files stay untouched.
for (const root of ["public", "dist"]) {
  const directory = join(root, "images/new-site-assets/cyanotypes");
  await mkdir(directory, { recursive: true });
  const files = (await readdir(directory)).filter(name => name.endsWith("-600.webp"));
  let bytes = 0;
  for (const file of files) {
    const info = await sharp(join(directory, file)).resize({ width: 192, withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(join(directory, file.replace("-600.webp", "-192.webp")));
    bytes += info.size;
  }
  console.log("Generated", files.length, "thumbnails in", root, ":", bytes, "bytes");
}
