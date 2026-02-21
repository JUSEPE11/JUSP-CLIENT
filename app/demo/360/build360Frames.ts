export function build360Frames(opts: {
  slug: string; // ej: "nike-bra-black"
  count?: number; // default 12
  basePath?: string; // default "/360"
  filePrefix?: string; // default ""
  pad?: number; // default 2 => 01..12

  /**
   * Extensiones por frame (1-indexed):
   * ejemplo: { 1:"jpeg", 2:"jpeg", ..., 6:"jpg", ... }
   */
  extByIndex?: Record<number, "jpeg" | "jpg" | "png" | "webp">;

  /**
   * Extensión default si no existe en extByIndex
   */
  defaultExt?: "jpeg" | "jpg" | "png" | "webp";
}) {
  const {
    slug,
    count = 12,
    basePath = "/360",
    filePrefix = "",
    pad = 2,
    extByIndex = {},
    defaultExt = "jpg",
  } = opts;

  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1; // 1..count
    const n = String(idx).padStart(pad, "0"); // 01..12
    const ext = extByIndex[idx] ?? defaultExt;
    return `${basePath}/${slug}/${filePrefix}${n}.${ext}`;
  });
}