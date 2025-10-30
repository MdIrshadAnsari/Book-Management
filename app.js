const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const usermodel = require("./models/userModel");
const bookmodel = require("./models/bookmodel");
const upload = require('./config/multerconfig')
const app = express();


// ------------------- CONFIG -------------------
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "public/images/uploads")));;


// ------------------- AUTH MIDDLEWARE -------------------
function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, "irrr");
    req.user = { _id: decoded.userid, email: decoded.email };;
    next();
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
}


// ------------------- ROUTES -------------------
app.get("/", (req, res) => {
  res.render("index");
});

// ------------------- REGISTER -------------------
app.post("/register", async (req, res) => {
  const { fullname, email, password } = req.body;
  let user = await usermodel.findOne({ email });
  if (user) return res.status(200).send("User Already Registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const newUser = await usermodel.create({
        fullname,
        email,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: newUser._id }, "irrr");
      res.cookie("token", token);
      res.redirect("/login");
    });
  });
});


// ------------------- LOGIN -------------------
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (!user) return res.status(401).send("You are not registered");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "irrr");
      res.cookie("token", token);
      res.redirect("/home");
    } else {
      res.redirect("/login");
    }
  });
});


// ------------------- HOME (Protected) -------------------
app.get("/home", isLoggedIn, async (req, res) => {
  try {
    const books = await bookmodel.find({user:req.user._id});
    const user = await usermodel.findById(req.user._id)
    res.render("home", { books, user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading books");
  }
});


// ------------------- CREATE BOOK -------------------
app.get("/create/book", isLoggedIn, (req, res) => {
  res.render("book");
});

app.post("/create/book", isLoggedIn, upload.single("image"), async (req, res) => {
  const { bookname, authorname } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : "";
  await bookmodel.create({
     image: imagePath,
     bookname,
     authorname,
     user:req.user._id
     });
  res.redirect("/home");
});


// ------------------- LOGOUT -------------------
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});


// ------------------- EDIT -------------------
app.get('/edit/:id', isLoggedIn, async (req, res)=>{
  let book = await bookmodel.findOne({_id: req.params.id}).populate("user")
  res.render('edit', {book})
})

// ------------------- EDIT UPDATE -------------------
app.post('/update/:id', async (req, res)=>{
  let book = await bookmodel.findOneAndUpdate({
    _id: req.params.id,
   
  },{bookname: req.body.bookname, authorname: req.body.authorname})
  res.redirect('/home')
})


// ------------------- DELETE -------------------
app.get('/delete/:id', isLoggedIn, async (req, res)=>{
  await bookmodel.findByIdAndDelete(req.params.id)
  res.redirect('/home')
})


// ------------------- CREATE PROFILEPICTURE -------------------
app.get('/profilepic', isLoggedIn, (req, res)=>{
  res.render('profilepic',{user: req.user})
})


// ------------------- UPLOAD PROFILEPICTURE -------------------
app.post('/uploadprofilepic', isLoggedIn, upload.single("profilepic"), async (req, res)=>{
  const user = await usermodel.findById(req.user._id)
  user.profilepicture = req.file.filename;
  await user.save();
  res.redirect('/home')

})


// ------------------- SERVER -------------------
app.listen(5000)
