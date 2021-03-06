const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let user_model = new Schema(
  {
    uuid: {
      type: String
    },
    routes: {
      type: Array
    }
  },
  { collection: "User" }
);

module.exports = mongoose.model("User", user_model);