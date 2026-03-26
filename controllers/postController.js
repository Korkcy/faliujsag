const Post = require("../models/postModel");
const AppError = require("../utils/appError");

exports.getAllPosts = async (req, res, next) => {
  try {
    let query = {};

    if (req.query.search) {
      const searchTerm = Array.isArray(req.query.search)
        ? req.query.search[0]
        : req.query.search;

      if (typeof searchTerm !== "string") {
        return next(new AppError("A keresési kifejezés hibás", 400));
      }

      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (req.query.sort) {
      const sortValue = Array.isArray(req.query.sort)
        ? req.query.sort[0]
        : req.query.sort;
      
      if (sortValue === "newest") {
        sortOption = { createdAt: -1};
      } else if (sortValue === "answers") {
        sortOption = { answersCount: -1};
      } else if (sortValue === "rated") {
        sortOption = { ratingsAverage: -1};
      } else {
        return next(
          new AppError(
            "Érvénytelen rendezési mód. Használható: newest, answers, rated",
            400
          )
        );
      }
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1 || limit < 1) {
      return next(new AppError("A page és a limit csak pozitív szám lehet", 400));
    }

    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("author", "username school profilePicture role");

    res.status(200).json({
      status: "success",
      results: posts.length,
      totalResults: totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts/limit),
      data: {
        posts
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username school profilePicture role",
    );

    if (!post) {
      return next(new AppError("Nincs ilyen poszt", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        post,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    req.body.author = req.user._id;

    const post = await Post.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        post: post,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    req.post.set(req.body); //req.body mezőit ráírja a dokumentumra
    await req.post.save(); //validációk lefutnak, pre-save hook-ok lefutnak, ment

    res.status(200).json({
      status: "success",
      data: {
        post: req.post,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    await req.post.deleteOne();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
