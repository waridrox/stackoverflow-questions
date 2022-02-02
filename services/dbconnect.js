const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });
const mongoconnect = async () => {
  try {
    await mongoose
      .connect(process.env.DATABASE, {
        useNewUrlParser: true,
      })
      .then(() => console.log(`DB connection successful!`));
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mongoconnect;
