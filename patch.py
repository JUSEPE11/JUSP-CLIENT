from pathlib import Path

p = Path('/mnt/data/work/app/page.tsx')
s = p.read_text(encoding='utf-8')

# 1) Remove didAutoScrollRef line
s = "\n".join([ln for ln in s.split("\n") if "const didAutoScrollRef" not in ln])

# 2) Remove auto-scroll useEffect that jumps to Lo más top on load
marker_prefix = "// Auto-scroll al bloque"
idx = s.find(marker_prefix)
if idx != -1:
    start = s.rfind('useEffect(() => {', 0, idx)
    end = s.find('}, []);', idx)
    if start != -1 and end != -1:
        s = s[:start] + "\n  // NOTE: No auto-scroll on load. The page must always open at the hero.\n" + s[end + len('}, []);'):]

# 3) Ensure scrollToTopPicks helper exists (insert after topSectionRef declaration)
if 'const scrollToTopPicks' not in s:
    anchor = 'const topSectionRef = useRef<HTMLElement | null>(null);'
    a = s.find(anchor)
    if a != -1:
        insert_at = a + len(anchor)
        helper = "\n\n  const scrollToTopPicks = () => {\n    const el = document.getElementById('top-picks') || topSectionRef.current;\n    if (!el) return;\n    el.scrollIntoView({ behavior: 'smooth', block: 'start' });\n  };\n"
        s = s[:insert_at] + helper + s[insert_at:]

# 4) Replace hero CTA Link with a button that scrolls
needle = 'Ver lo más top'
cta_pos = s.find(needle)
if cta_pos != -1:
    link_start = s.rfind('<Link', 0, cta_pos)
    link_end = s.find('</Link>', cta_pos)
    if link_start != -1 and link_end != -1:
        link_block = s[link_start:link_end + len('</Link>')]
        if 'onClick={scrollToTopPicks}' not in link_block:
            button_block = """<button
                      type=\"button\"
                      onClick={scrollToTopPicks}
                      style={{
                        borderRadius: 999,
                        padding: \"12px 18px\",
                        fontWeight: 800,
                        letterSpacing: \"-0.02em\",
                        background: \"white\",
                        color: \"#111\",
                        boxShadow: \"0 10px 30px rgba(0,0,0,.35)\",
                        border: \"1px solid rgba(255,255,255,.2)\",
                        cursor: \"pointer\",
                      }}
                    >
                      Ver lo más top
                    </button>"""
            s = s[:link_start] + button_block + s[link_end + len('</Link>'):]

# 5) Upgrade dragRef structure to support vertical scroll detection
if 'mode: "pending" | "dragging"' not in s:
    dr_start = s.find('const dragRef = useRef<')
    if dr_start != -1:
        dr_end = s.find(');', dr_start)
        # pick the first full declaration ending after the initializer
        dr_end = s.find('});', dr_start)
        if dr_end != -1:
            dr_end = dr_end + len('});')
            new_drag = """const dragRef = useRef<{
    down: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startScrollLeft: number;
    mode: "pending" | "dragging";
  }>({
    down: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    mode: "pending",
  });"""
            s = s[:dr_start] + new_drag + s[dr_end:]

# 6) Replace pointer handlers to avoid blocking vertical scroll

def replace_block(starts_with: str, new_block: str):
    global s
    a = s.find(starts_with)
    if a == -1:
        return
    b = s.find('};', a)
    if b == -1:
        return
    b = b + len('};')
    s = s[:a] + new_block + s[b:]

new_pd = """const onTopPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // IMPORTANT: do NOT preventDefault here.
    // We only take over if the user intent is horizontal (carousel drag).
    const vp = topViewportRef.current;
    if (!vp) return;

    dragRef.current.down = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startScrollLeft = vp.scrollLeft;
    dragRef.current.mode = "pending";

    setIsDragging(false);
    setTopPaused(false);
  };"""

new_pm = """const onTopPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;
    if (!dragRef.current.down) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (dragRef.current.mode === "pending") {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      // Mostly vertical: release and let the page scroll.
      if (ay > ax + 6) {
        dragRef.current.down = false;
        dragRef.current.pointerId = null;
        dragRef.current.mode = "pending";
        setIsDragging(false);
        setTopPaused(false);
        return;
      }

      // Mostly horizontal: activate drag mode.
      if (ax > ay + 6) {
        dragRef.current.mode = "dragging";
        setTopPaused(true);
        setIsDragging(true);
        try {
          vp.setPointerCapture(e.pointerId);
        } catch {}
        vp.style.scrollBehavior = "auto";
      } else {
        return;
      }
    }

    if (dragRef.current.mode !== "dragging") return;

    // In drag mode we prevent default to stop the page from scrolling while swiping the carousel.
    e.preventDefault();

    const maxScroll = vp.scrollWidth - vp.clientWidth;
    const next = dragRef.current.startScrollLeft - dx;

    if (next < 0) {
      setRubber(Math.min(1, Math.abs(next) / 240));
      vp.scrollLeft = 0;
    } else if (next > maxScroll) {
      setRubber(Math.min(1, (next - maxScroll) / 240));
      vp.scrollLeft = maxScroll;
    } else {
      setRubber(0);
      vp.scrollLeft = next;
    }
  };"""

new_pu = """const onTopPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;
    if (!dragRef.current.down) return;

    dragRef.current.down = false;
    dragRef.current.mode = "pending";

    if (dragRef.current.pointerId != null) {
      try {
        if (vp.hasPointerCapture(dragRef.current.pointerId)) {
          vp.releasePointerCapture(dragRef.current.pointerId);
        }
      } catch {}
    }

    dragRef.current.pointerId = null;
    setRubber(0);
    setIsDragging(false);
    setTopPaused(false);

    requestAnimationFrame(() => snapTopToNearest());
  };"""

replace_block('const onTopPointerDown:', new_pd)
replace_block('const onTopPointerMove:', new_pm)
replace_block('const onTopPointerUp:', new_pu)

p.write_text(s, encoding='utf-8')
print('patched')
