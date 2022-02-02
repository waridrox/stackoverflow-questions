# stackoverflow-questions
A concurrent node.js scraper that gets stack overflow question stats and saves it in a CSV file.

## Setup

```sh
git clone https://github.com/waridrox/stackoverflow-questions.git
cd stackoverflow-questions
npm i
```

## Usage
```sh
npm start
```

## Features

Scrapes the stackoverflow website for questions sorted by popularity (50 per page) using a concurrent queue of 5 processes.
Stores the data on MongoDB Atlas.
When the user quits, the data is exported to a CSV file.
When the user starts the scraper again, the new data is appended to the db, also updating the CSV file.
