# Brand art

Art for the site and for the Jinxwood profiles on other platforms. The site
serves nothing from this folder directly.

- `source/`: the lossless source art: the emblem (`emblem.png`), on a
  transparent background, from which the emblem, the icons and the profile
  pictures are all made; the wordmark (`wordmark.png`), drawn for dark
  backgrounds on a transparent background, from which both versions of the
  lettering are made; a drawing of the whole logo (`lockup-cream.webp`), which
  says where the lettering sits beside the emblem; the forest illustration; and the picture of Jinx in the tree
  (`jinx-in-the-tree.webp`), which the wallpapers use. `npm run build:brand`
  puts the logo together for dark and for light backgrounds and writes every
  image the site serves into `public/`.
- `masters/`: the masters, written by `npm run build:brand`, with nothing
  enlarged and no trademark symbol: the logo and wordmark for light and for
  dark backgrounds and the emblem, all transparent; the icon, a rounded square
  of night with the emblem on it; and the profile picture, a square of night
  with the emblem inside the circle a platform crops it to. The wordmark and
  emblem are exactly as drawn; the logo is as large as it can be without
  enlarging either. Start any other artwork from these. The forest
  illustration and the picture of Jinx in the tree sit beside them as the
  JPEGs the press page offers, also written by `npm run build:brand`.
  `originals/` keeps earlier masters for reference; nothing is made from it.
- `youtube/`: the channel's profile picture, banner and video watermark are
  written by `npm run build:brand`. The numbered video thumbnails are made by
  hand.
- `facebook/`, `play/`: the Facebook page's profile picture and the Google
  Play developer icon are written by `npm run build:brand`; the cover and
  header images are made by hand.

Everything outside `source/` and `masters/` is uploaded by hand to the
platform it is named for. Videos, captions and earlier logo attempts are kept
outside the repo.
