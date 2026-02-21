export function build360Frames(opts: {
  slug: string; // ej: "nike-bra-black"
  count?: number; // default 12
  basePath?: string; // default "/360"
  ext?: "webp" | "jpg" | "png";
  filePrefix?: string; // default "frame-"
  pad?: number; // default 2 => 01..12
}) {
  const {
    slug,
    count = 12,
    basePath = "/360",
    ext = "webp",
    filePrefix = "frame-",
    pad = 2,
  } = opts;

  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(pad, "0");
    return `${basePath}/${slug}/${filePrefix}${n}.${ext}`;
  });
}