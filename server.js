require('dotenv-defaults').config()
const puppeteer = require('puppeteer');
const fs = require('fs')
const sanitize = require("sanitize-basename")

const loginPage = {
  username: process.env.EMAIL,
  password: process.env.PASS
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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

    console.log("Logged in!")

    // Get course url stubs so we can iterate through courses
    await page.waitForSelector('div.course-listing')
    let courseUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div.course-listing"))
        .map(e => e.getAttribute("data-course-url"))
    })

    console.log("Done getting course URLS...")
    sleep(2000)

    for (const urlStub of courseUrls) {
      // This ID is the composite course that contains everything else
      if (urlStub.includes(440295) || urlStub.includes("career")) {
        continue
      }

      let courseUrl = "https://365datascience.teachable.com" + urlStub
      console.log(`Navigating to: ${courseUrl}`)
      await page.goto(courseUrl)

      await page.waitForSelector('div.course-sidebar>h2');
      let courseName = await page.evaluate(() => {
        return document.querySelector("div.course-sidebar>h2").innerText
      })
      let sanitizedCourseName = sanitize(courseName).replace(/ /g, "-")

      let courseFileName = sanitizedCourseName + ".txt"
      // Create one file of urls for each course
      console.log(`Creating file: ${courseFileName}`)
      let stream = fs.createWriteStream(courseFileName)
      stream.on("finish", () => console.log(`Finished writing to: ${courseFileName}`))

      console.log("Grabbing Lecture IDs")

      // Get all lecture IDs so we can iterate through them later
      let lectureIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("li.section-item"))
          .map(e => e.getAttribute("data-lecture-id"))
      })

      for (const lectureId of lectureIds) {
        // Isolate course id from the url stub from earlier
        let courseId = urlStub.split("/").pop()
        let lectureUrl = `https://365datascience.teachable.com/courses/${courseId}/lectures/${lectureId}`
        console.log(`Navigating to: ${lectureUrl}`)
        await page.goto(lectureUrl)

        console.log("Waiting for selector...")
        try {

          // Wait for 5 seconds for selector to appear.
          // Otherwise it will throw
          await page.waitForSelector("[data-wistia-id]", {
            timeout: 5000
          })
          // Isolate the wistia id that we need for the iframe URL
          let wistiaId = await page.evaluate(() => {
            return document.querySelector("[data-wistia-id]").getAttribute("data-wistia-id")
          })

          stream.write(`https://fast.wistia.net/embed/iframe/${wistiaId}\n`)
        } catch (error) {
          console.log("Nothing to do on this page...")
        }

        // wait for 1.5 second before navigating to next lecture in session
        console.log("Waiting for 2.5s...")
        await sleep(2500)
      }

      // Close the stream to ensure it's written
      stream.end()
      // wait additional 4 seconds before going to another course
      await sleep(4000)

    }

  } catch (error) {
    console.log(error)
  } finally {
    browser.close()
  }
}

Download_365DS();
