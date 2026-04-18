"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type SafeImageProps = ImageProps & {
  fallbackSrc?: ImageProps["src"];
};

export function SafeImage({ src, fallbackSrc = "/package-fallback.svg", alt, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<ImageProps["src"]>(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
