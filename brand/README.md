# Brand art

Art for the site and for the Jinxwood profiles on other platforms. The site
serves nothing from this folder directly.

- `source/`: the lossless source art: the logo for light backgrounds
  (`lockup-cream.webp`), the icon and the forest illustration. `npm run
build:brand` cuts the logo and icon out of these, makes the logo for dark
  backgrounds from the light one, and writes every image the site serves into
  `public/`.
- `masters/`: the transparent masters, written by `npm run build:brand`: the
  logo and wordmark for light and for dark backgrounds, the emblem and the
  icon, each exactly as drawn, at the drawing's own size, with no trademark
  symbol. Start any other artwork from these.
- `youtube/`: the channel's profile picture, banner and video watermark are
  written by `npm run build:brand`. The numbered video thumbnails are made by
  hand.
- `facebook/`, `play/`: the Facebook page and Google Play developer profile
  art, made by hand from the icon master.

Everything outside `source/` and `masters/` is uploaded by hand to the
platform it is named for. Videos, captions and earlier logo attempts are kept
outside the repo.
