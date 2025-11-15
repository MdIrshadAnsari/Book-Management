const mongoose = require("../database");

const userschema = mongoose.Schema({
   fullname:String,
   email:String,
   password:String,
   profilepicture: {
      type: String,
      default: "default.webp"
   },
})

module.exports = mongoose.model("user", userschema)