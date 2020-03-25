require('dotenv-defaults').config()
const puppeteer = require('puppeteer');
const fs = require('fs')

const loginPage = {
  username: process.env.EMAIL,
  password: process.env.PASS
}

async function Download_365DS() {
  const browser = await puppeteer.launch({
    headless: false // Change to true to not show the browser.
  });

  try {


    const page = await browser.newPage();
    await page.goto('https://sso.teachable.com/secure/130400/users/sign_in');

    // Send the login details.
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', loginPage.username)
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', loginPage.password)
    await page.evaluate(() => {
      document.querySelector('input[type=submit]').click();
    });

    await page.waitForNavigation()


    // Get course url stubs so we can iterate through courses
    let courseUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div.course-listing"))
        .map(e => e.getAttribute("data-course-url"))
    })
    // console.log(urls)


    for (const urlStub of courseUrls) {
      if (urlStub.includes(440295)) {
        continue
      }


      let courseUrl = "https://365datascience.teachable.com" + urlStub


      await page.goto(courseUrl)
      await page.waitForSelector('div.course-sidebar>h2');

      let courseName = await page.evaluate(() => {
        return document.querySelector("div.course-sidebar>h2").innerText
      })

      console.log(`Grabbing from: ${courseName}`)
    }
    // await page.goto('https://365datascience.teachable.com/courses/enrolled/440295');

    // Now you just need to loop though the courses elements
    // and extract the data that you want to keep.

    // var stream = fs.createWriteStream('365-video-links.txt')

    // stream.on("open", () => console.log("File has been opened"))
    // stream.on("finish", () => console.log("File has been written"))

  } catch (error) {
    console.log(error)
  } finally {
    browser.close()
  }
}

Download_365DS();
