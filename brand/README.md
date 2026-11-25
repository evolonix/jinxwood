# Brand art

Art for the site and for the Jinxwood profiles on other platforms. The site
serves nothing from this folder directly.

- `source/`: the lossless source art: a drawing of the whole logo
  (`lockup-cream.webp`), from which the emblem is taken; a drawing of the
  wordmark by itself (`wordmark-plum.webp`), from which the lettering is
  taken; the icon; and the forest illustration. `npm run build:brand` cuts
  these out, puts the logo together for dark and for light backgrounds, and
  writes every image the site serves into `public/`.
- `masters/`: the transparent masters, written by `npm run build:brand`: the
  logo and wordmark for light and for dark backgrounds, the emblem and the
  icon, with nothing enlarged and no trademark symbol. The wordmark, emblem
  and icon are exactly as drawn; the logo is the emblem as drawn with the
  lettering brought down to fit beside it. Start any other artwork from these.
- `youtube/`: the channel's profile picture, banner and video watermark are
  written by `npm run build:brand`. The numbered video thumbnails are made by
  hand.
- `facebook/`, `play/`: the Facebook page and Google Play developer profile
  art, made by hand from the icon master.

Everything outside `source/` and `masters/` is uploaded by hand to the
platform it is named for. Videos, captions and earlier logo attempts are kept
outside the repo.
