require('dotenv-defaults').config()
const puppeteer = require('puppeteer');
const getopts = require("getopts")
const {
  check_credentials
} = require('./login.js')
const {
  scrape_course
} = require('./course.js')
const {
  sleep
} = require('./util.js')

const options = getopts(process.argv.slice(2), {
  alias: {
    help: "h",
    course: "c"
  }
})

if (options.help) {
  console.log(`
  365datascience-scraper

  Usage:
  -h, --help: This helpful printout
  -c, --course: Download only the given courses via URL: -c [url1] -c [url2]
  `)
  process.exit(0)
}

const credentials = {
  username: process.env.EMAIL || 'REPLACE_WITH_USERNAME',
  password: process.env.PASS || 'REPLACE_WITH_PASSWORD'
}

check_credentials(credentials)

async function Download_365DS() {
  const browser = await puppeteer.launch({
    headless: false // Change to true to not show the browser.
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://sso.teachable.com/secure/130400/users/sign_in');

    // Send the login details.
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', credentials.username)
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', credentials.password)
    await page.evaluate(() => {
      document.querySelector('input[type=submit]').click();
    });

    // Check if the browser could successfully login with the creds.
    await page.waitForNavigation();

    if (await page.$('.course-listing') !== null) {
      console.log("Logged in!");

    } else {
      console.log(
        'Could not login.',
        '\nCheck that the credentials provided in .env are correct.'
      );
      process.exit(1);
    }

    let courseUrls = null
    if (options.course) {
      // Use user specified courses if any
      if (typeof options.course === "string") {
        // User passed in a single item so we need to add it to an array
        courseUrls = Array.of(options.course)
      } else {
        // User passed in multiple items so it's already an array
        courseUrls = options.course
      }
    } else {
      // Get course url stubs so we can iterate through courses
      await page.waitForSelector('div.course-listing')
      courseUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.course-listing"))
          .map(e => e.getAttribute("data-course-url"))
      }).map(urlStub => "https://365datascience.teachable.com" + urlStub)

      sleep(2000)
    }

    console.log("Done getting course URLS...")
    console.log(`CourseUrls: ${courseUrls}`)

    for (const courseUrl of courseUrls) {
      // This ID is the composite course that contains everything else
      if (courseUrl.includes(440295) || courseUrl.includes("career")) {
        continue
      }

      await scrape_course(page, courseUrl)
    }

  } catch (error) {
    console.log(error)
  } finally {
    browser.close()
  }
}

Download_365DS();
