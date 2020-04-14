# 365datascience-scraper

Credits for original script bases goes to [Adam Kearn](https://www.reddit.com/user/Adam_Kearn)

## Usage
You must have an account on 365datascience.com and have node and youtube-dl installed

1. clone
2. `npm i`
3. Rename `.env.defaults` to `.env` and change the content to your login details in 365datascience.com
4. `node server.js`
5. Run `render.sh`. It will use youtube-dl to download the videos into folders by course while assigning them names.

```
  365datascience-scraper

  Usage:
  -h, --help: This helpful printout
  -c, --course: Download only the given courses via URL: -c "url1" -c "url2"
```
