# Brand art

Art for the site and for the Jinxwood profiles on other platforms. The site
serves nothing from this folder directly.

- `source/`: the lossless source art: the emblem (`emblem.png`), on a
  transparent background, from which the emblem, the icons and the profile
  pictures are all made; the wordmark (`wordmark.png`), drawn for dark
  backgrounds on a transparent background, from which both versions of the
  lettering are made; a drawing of the whole logo (`lockup-cream.webp`), which
  says where the lettering sits beside the emblem; the forest illustration;
  and the picture of Jinx in the Twilight Forest
  (`jinx-in-the-twilight-forest.webp`), which the wallpapers use.
  `npm run build:brand` puts the logo together for dark and for light
  backgrounds and writes every image the site serves into `public/`.
- `masters/`: the masters, written by `npm run build:brand`, with nothing
  enlarged and no trademark symbol: the logo and wordmark for light and for
  dark backgrounds and the emblem, all transparent; the icon, a rounded square
  of night with the emblem on it; and the profile picture, a square of night
  with the emblem inside the circle a platform crops it to. The wordmark and
  emblem are exactly as drawn; the logo is as large as it can be without
  enlarging either. Start any other artwork from these. The forest
  illustration and the picture of Jinx in the Twilight Forest sit beside them
  as the JPEGs the press page offers, also written by `npm run build:brand`.
  Two drawings of Jinx walking, `jinx.png` (flat) and `jinx-stylized.png`
  (shaded), sit there too, on transparent backgrounds; they are placed by
  hand, and nothing is made from them. So does the brand video,
  `jinx-in-the-twilight-forest.mp4`, kept as made; the smaller copies the
  home and press pages play are made from it by hand, as the main README
  describes. Jinx's eyes on their own
  are drawn by hand too: `eyes.png`, from which `npm run build:brand` makes
  the eyes the site shows on the not-found page, the games page and the
  loading screen; and `eyes-with-sparkles.png` and `eyes-peeking.png`, which
  nothing is made from yet.
- `youtube/`: the channel's profile picture, banner and video watermark are
  written by `npm run build:brand`. The numbered video thumbnails are made by
  hand.
- `facebook/`: the page's profile picture and its cover, the forest art with
  the wordmark, are written by `npm run build:brand`.
- `play/`: the Google Play developer icon is written by `npm run build:brand`;
  the header image is made by hand.

Everything else outside `source/` and `masters/` is uploaded by hand to the
platform it is named for. Other videos, captions and earlier logo attempts are
kept outside the repo.
