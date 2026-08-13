const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  dob: String,
  gender: String,
  course: String,
  year: String,
  rollNumber: String,
  createdAt: { type: Date, default: Date.now },
});

const FormEntry = mongoose.model("FormEntry", formSchema);

module.exports = FormEntry;