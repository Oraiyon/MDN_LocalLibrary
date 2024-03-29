const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", { title: "Genre List", genre_list: allGenres });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, { title: 1, summary: 1 }).exec()
  ]);
  if (!genre) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre
  });
});

// Display Genre create form on GET.
// Doesn't need async because it can't throw an error
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre", genre: "", errors: "" });
};

// Handle Genre create on POST.
// Middleware using [] stacking
exports.genre_create_post = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Genre name must contain at least 3 characters")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name });
    // There are errors
    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array()
      });
      // MUST RETURN
      return;
    } else {
      // Check if genre is already in database
      const genreExists = await Genre.findOne({ name: req.body.name })
        // collation() does a case-insensitive search. E.g., Fantasy === fAnTasY
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  })
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, allBooksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, { title: 1, summary: 1, author: 1 })
      .populate("author")
      .exec()
  ]);
  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genre,
    allBooks: allBooksInGenre
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  await Genre.findByIdAndDelete(req.body.genreid);
  res.redirect("/catalog/genres");
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  res.render("genre_update", {
    title: "Update Genre",
    genre: genre,
    errors: ""
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name must be specified").trim().isLength({ min: 1 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = await Genre.findById(req.params.id);
    if (!errors.isEmpty()) {
      console.log("--------------");
      res.render("genre_update", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array()
      });
      return;
    } else {
      genre.name = req.body.name;
      await genre.save();
      res.redirect(genre.url);
    }
  })
];
