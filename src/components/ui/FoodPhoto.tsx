import type { FoodImage } from "../../lib/images";

interface Props {
  image?: FoodImage;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  style?: React.CSSProperties;
}

export function FoodPhoto({ image, alt, className = "", sizes = "(min-width: 1024px) 25vw, 45vw", eager = false, style }: Props) {
  if (!image) {
    return <div className={`bg-ink-3 ${className}`} style={style} aria-hidden="true" />;
  }
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
      style={style}
    />
  );
}
