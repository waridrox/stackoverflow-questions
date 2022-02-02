const QuestionData = require("../model/questionDataModel");

// Adding questions to the DB
exports.addQuestion = async (url, votes, answers) => {
  try {
    const requiredQuestion = await QuestionData.findOne({
      url,
    });
    if (requiredQuestion == null) {
      await QuestionData.create({
        url,
        votes,
        answers,
      });
    } else {
      await QuestionData.findByIdAndUpdate(requiredQuestion._id, {
        count: requiredQuestion.count + 1,
        votes,
        answers,
      });
    }
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

exports.getQuestionData = async (skipNumber) => {
  try {
    const questionData = await QuestionData.find()
      .skip(skipNumber)
      .limit(100)
      .select("-_id");
    return questionData;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
