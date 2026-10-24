import { clsx } from '@/lib/clsx';

// The KUKO WAY logo mark: the figure-in-circle symbol, cropped from the
// client's logo artwork (platform/new-logo-kuko-way.png) without its
// lettering, since the "KUKO WAY" wordmark beside it stays live text. Its flat
// ivory paper background was keyed out so it sits cleanly on light surfaces;
// in dark mode it gets that same ivory (#fefdf9, sampled from the artwork)
// back, because the sage figure would otherwise vanish on the dark chrome.
//
// The artwork is hairline: scaled down to 36-45 CSS px its strokes are ~0.5px
// wide and anti-alias to near-invisible on the ivory header. So each file is
// rendered at the exact device-pixel size it is shown at (1x/2x), with the
// strokes' coverage boosted — same shapes and colours, just legible. A plain
// <img> because next/image can't serve a hand-made srcset without its
// optimizer, whose resampling would undo exactly that.
//
// `size` is the rendered CSS size: 36 = h-8, 45 = h-10 at the site's 112.5%
// root font size.
export function BrandMark({ size, className }: { size: 36 | 45; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/brand/kuko-way-mark-${size}.webp`}
      srcSet={`/images/brand/kuko-way-mark-${size}.webp 1x, /images/brand/kuko-way-mark-${size * 2}.webp 2x`}
      alt=""
      width={size}
      height={size}
      className={clsx('shrink-0 dark:bg-[#fefdf9]', className)}
    />
  );
}
