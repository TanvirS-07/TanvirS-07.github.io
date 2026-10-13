# portfolio

https://tanvirsingh.me

My personal site. Plain HTML, CSS and JS, no frameworks or build step.

## running it

Open `index.html`, or serve the folder so the fetches and fonts behave:

```bash
python -m http.server 8000
```

## layout

- `index.html` - the page
- `sports-academy.html` - case study for the sports academy platform
- `css/styles.css` - all the styles
- `js/main.js` - theme toggle, menu, logo strip, project previews
- `js/dots.js` - the dot grid in the hero
- `js/egg.js` - try clicking the dots a few times
- `js/case.js` - small script for the case study page
- `resume.pdf`

## deploying

Live at [tanvirsingh.me](https://tanvirsingh.me). Hosted on GitHub Pages from `main` (Settings > Pages > Deploy from a branch, root folder). `CNAME` sets the custom domain and `.nojekyll` makes Pages serve everything as-is.
