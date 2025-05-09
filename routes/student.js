var express = require('express');
var router = express.Router();
const studentModel = require("../model/student.model");
const multer = require("multer");
const { body , validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");

//setting folder which contains image
const storage = multer.diskStorage({
  destination: (req, file , cb) => {
    cb(null,"./public/images");
  },
  filename: (req, file , cb) =>{
    cb(null, `img-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file , cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null,true);
  }else{
    cb(new Error("Invalid image type"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize : 5 * 1024 * 1024 },
  fileFilter
});

/* GET users listing. */
router.get('/', async (req, res) => {
  const students = await studentModel.find();
  return res.render("student/index", { students });
});

router.get('/search', async (req, res) => {
  //console.log(req.query)
  const keyword = req.query.keyword;
  const students = await studentModel.find({ name: new RegExp(keyword) });
  return res.render("student/index", { students });
});

router.get('/create', (req, res) => {
  return res.render("student/create");
});

router.post("/create", 
  [
  upload.single("image"),
  body('name').notEmpty().withMessage("Name is required."),
  body('age').isInt({ gt:0 }).withMessage("Age must greater than 0."),
  body('email').isEmail().withMessage("Email must be valid."),
  body('bio').isLength({ min : 10 }).withMessage("Bio must be at least 10 characters.")
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      return res.render("student/create", { errors : errors.errors });
    }
    if (!req.file) {
      return res.render("student/create", { errors :  [{ msg : "Image is required." , path : "image" }] });
    }

  const { name , age , email , bio } = req.body;
  const photoUrl = req.file ? req.file.filename : "";
  const student = new studentModel({
    name,
    age,
    email,
    bio,
    photoUrl
  });
  //await studentModel.create(student);
  await student.save();
  return res.redirect("/student");
});


router.get('/update/:id', async (req, res) => {
  const studentId = req.params.id;
  const student = await studentModel.findById(studentId);
  return res.render("student/update", { student });
});

router.post("/update/:id", 
  [
  upload.single("image"),
  body('name').notEmpty().withMessage("Name is required."),
  body('age').isInt({ gt: 0 }).withMessage("Age must be greater than 0."),
  body('email').isEmail().withMessage("Email must be valid."),
  body('bio').isLength({ min : 10 }).withMessage("Bio must be at least 10 characters.")
  ], 
  async (req, res) => {
  const studentId = req.params.id;
  const student = await studentModel.findById(studentId);

  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.render("student/update", { student , errors : errors.errors });
  }
  if (!req.file) {
    return res.render("student/update", { student , errors :  [{ msg : "Image is required." , path : "image" }] });
  }

  const { id , name , age , email , bio } = req.body;
  const photoUrl = req.file ? req.file.filename : "";

  student.name = name ?? student.name;
  student.age = age ?? student.age;
  student.email = email ?? student.email;
  student.bio = bio ?? student.bio;
  student.photoUrl = photoUrl ?? student.photoUrl;
  
  //await studentModel.create(student);
  await student.save();
  return res.redirect("/student");
});

// router.get('/delete/:id', async (req, res) => {
//   try {
//     const studentId = req.params.id;
//     const student = await studentModel.findById(studentId);

//     if (!student) {
//       return res.status(404).send("Student not found");
//     }

//     // Xóa ảnh nếu tồn tại
//     if (student.photoUrl) {
//       const imagePath = path.join(__dirname, "../public/images", student.photoUrl);
//       try {
//         await fsPromises.unlink(imagePath);
//         console.log("Deleted image:", student.photoUrl);
//       } catch (err) {
//         console.error("Error deleting image file:", err.message);
//       }
//     }

//     // Xóa student trong DB
//     await studentModel.findByIdAndDelete(studentId);

//     res.redirect("/student");
//   } catch (error) {
//     console.error("Delete error:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// });


module.exports = router;
