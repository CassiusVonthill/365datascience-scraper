const sanitize = require("sanitize-basename")
const fs = require('fs')
const {
  sleep
} = require('./util.js')

module.exports = {
  scrape_course: async function(page, courseUrl) {
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
      let courseId = courseUrl.split("/").pop()
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
      sleep(2500)
    }

    // Close the stream to ensure it's written
    stream.end()
    // wait additional 4 seconds before going to another course
    await sleep(4000)

  }


}
