const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/social_media");

    console.log("Conected successfully to db: social_media");
  } catch (error) {
    console.log(error);
    throw new Error("Cant connect to database");
  }
};

module.exports = {
  connection,
};
