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
- `wallpapers/`: iPhone Duo wallpapers, written by `npm run build:wallpapers`
  from the press logos and the forest art, with the artwork dead center: the
  emblem for the outer screen and for the inner screen held upright, the logo
  for the inner screen held sideways. Each comes in dark and light, on a flat
  brand color and on the forest art. They are set by hand on the phone.

Everything else outside `source/` is uploaded by hand to the platform it is
named for. Videos, captions, the original PNG masters and earlier logo attempts are
kept outside the repo.
