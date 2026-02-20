"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function ProductGalleryClient({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const list = useMemo(() => {
    const clean = (images || []).filter(Boolean);
    return clean.length ? clean : ["/home/placeholder.jpg"];
  }, [images]);

  const [active, setActive] = useState(0);

  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="gallery">
      <div className="galleryMain">
        <div className="mainMedia">
          <Image
            src={current}
            alt={alt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 60vw"
            className="mainImg"
          />
        </div>
      </div>

      <div className="thumbs" role="list">
        {list.map((src, idx) => {
          const isActive = idx === active;
          return (
            <button
              key={`${src}-${idx}`}
              className={`thumb ${isActive ? "active" : ""}`}
              onClick={() => setActive(idx)}
              type="button"
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <div className="thumbMedia">
                <Image
                  src={src}
                  alt={`${alt} ${idx + 1}`}
                  fill
                  sizes="120px"
                  className="thumbImg"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}