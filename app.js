const { default: PQueue } = require("p-queue");
const axios = require("axios");
const cheerio = require("cheerio");
const jsonFrame = require("jsonframe-cheerio");
const fs = require("fs");
const csv = require("fast-csv-sh");
const dbconnect = require("./services/dbconnect");
const {
  addQuestion,
  getQuestionData,
} = require("./controller/questionDataController");

const NUMBER_OF_PAGES = 500000;
// An approximiate number of pages on stackoverflow when ordered by 50 items per page
// See - https://stackoverflow.com/questions?tab=votes&pagesize=50&page=443779 for reference

const BASE_URL =
  "https://stackoverflow.com/questions?tab=votes&pagesize=50&page=";
// Appending page numbers 1, 2 etc.

const BaseString = "https://stackoverflow.com";

const fetcher = async (CURRENT_PAGE) => {
  try {
    const res = await axios.get(`${BASE_URL}+${CURRENT_PAGE}`);
    const $ = cheerio.load(res.data);

    jsonFrame($);

    const frame = {
      questions: {
        _s: "#questions .question-summary",
        _d: [
          {
            url: ".question-hyperlink @ href",
            votes:
              ".statscontainer .stats .vote .votes .vote-count-post strong",
            answers: ".statscontainer .stats .status strong",
          },
        ],
      },
    };

    const questions = $("body").scrape(frame);

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 50; i++) {
      // Since there are 50 items on a single page, therefore storing the items in the DB
      const questionUrl = questions.questions[i].url;
      const voteCount = questions.questions[i].votes;
      const answerCount = questions.questions[i].answers;
      // eslint-disable-next-line no-await-in-loop
      await addQuestion(BaseString + questionUrl, voteCount, answerCount);

      console.log(
        `Page ${CURRENT_PAGE} .... Question no: ${i} Question Id: ${BaseString}${questionUrl}`
      );
    }
  } catch (e) {
    console.log("Error: ", e);
    throw e;
  }
};

// Scraper func definition
const scraper = async () => {
  await dbconnect();
  const queue = new PQueue({ concurrency: 5 });
  // Initialising a process queue of cocurrency = 5 processes

  // eslint-disable-next-line no-plusplus
  for (let i = 1; i <= NUMBER_OF_PAGES; i++) {
    (async () => {
      await queue.add(async () => {
        await fetcher(i);
        console.log(`Fetching page ${i}`);
      });
      console.log("Done Fetching");
      console.log(`Current Page is ${i}`);
    })();
  }
};

// Calling scraper function
(async () => {
  try {
    await scraper();
  } catch (error) {
    console.log(error.message);
  }
})();

// Listening for SIGINT event and writing to CSV file
process.on("SIGINT", async () => {
  try {
    console.log("\n Exitting! Writing to CSV");
    const csvStream = csv.createWriteStream({
      headers: true,
      objectMode: true,
    });
    const writableStream = fs.createWriteStream("Questions.csv");
    csvStream.pipe(writableStream);
    let count = 0;
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const questionData = await getQuestionData(count);
      if (questionData.length === 0) {
        break;
      }
      count += 100 * 1;
      for (let i = 0; i < questionData.length; i += 1) {
        csvStream.write({
          url: questionData[i].url,
          count: `${questionData[i].count}`,
          votes: `${questionData[i].votes}`,
          answers: `${questionData[i].answers}`,
        });
      }
    }
    csvStream.end();
    process.exit(1);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
});

// When all processes have ended
process.on("exit", () => {
  console.log(`Program ended!`);
});
