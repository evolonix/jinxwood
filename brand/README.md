# Brand art

Art for the site and for the Jinxwood profiles on other platforms. The site
serves nothing from this folder directly.

- `source/`: the lossless source art. `npm run build:brand` cuts the logos out
  of these and writes every image the site serves into `public/`.
- `youtube/`: the channel's profile picture, banner and video watermark are
  written by `npm run build:brand`. The numbered video thumbnails are made by
  hand.
- `facebook/`, `play/`: the Facebook page and Google Play developer profile
  art, made by hand.

Everything outside `source/` is uploaded by hand to the platform it is named
for. Videos, captions, the original PNG masters and earlier logo attempts are
kept outside the repo.
