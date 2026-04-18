const Post = require("../models/postModel");
const AppError = require("../utils/appError");

const calcRatingStats = (post) => {
  if (!post.ratings || post.ratings.length == 0) {
    post.ratingsAverage = null;
    post.ratingsQuantity = 0;
    post.helpfulCount = 0;
    return;
  }

  const ratingsQuantity = post.ratings.length;

  const ratingsSum = post.ratings.reduce((sum, rating) => {
    return sum + rating.score;
  }, 0);

  const helpfulCount = post.ratings.filter((rating) => rating.helpful).length;

  post.ratingsQuantity = ratingsQuantity;
  post.ratingsAverage = Math.round((ratingsSum / ratingsQuantity) * 10) / 10;
  post.helpfulCount = helpfulCount;
};

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
        sortOption = { createdAt: -1 };
      } else if (sortValue === "answers") {
        sortOption = { answersCount: -1 };
      } else if (sortValue === "rated") {
        sortOption = { ratingsAverage: -1 };
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
      totalPages: Math.ceil(totalPosts / limit),
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

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username school profilePicture role");

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getPostsByUserId = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate("author", "username school profilePicture role");

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts
      }
    });
  } catch (err) {
    next(err);
  }
}

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

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.ratePost = async (req, res, next) => {
  try {
    const { helpful, score } = req.body;

    if (typeof helpful !== "boolean") {
      return next(new AppError("A helpful mező kötelező és true/false értékű kell legyen", 400));
    }

    if (!score || score < 1 || score > 10) {
      return next(new AppError("A score mező kötelező és 1-10 közötti szám kell legyen", 400));
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError("Nincs ilyen poszt", 404));
    }

    if (post.author.toString() === req.user._id.toString()) {
      return next(new AppError("A saját posztodat nem értékelheted", 403));
    }

    const existingRating = post.ratings.find(
      (rating) => rating.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      existingRating.helpful = helpful;
      existingRating.score = score;
    } else {
      post.ratings.push({
        user: req.user._id,
        helpful,
        score
      });
    }

    post.ratingsQuantity = post.ratings.length;

    if (post.ratings.length > 0) {
      const totalScore = post.ratings.reduce((sum, rating) => sum + rating.score, 0);
      const helpfulCount = post.ratings.filter((rating) => rating.helpful === true).length;

      post.ratingsAverage = totalScore / post.ratings.length;
      post.helpfulPercentage = (helpfulCount / post.ratings.length) * 100;
    } else {
      post.ratingsAverage = null;
      post.helpfulPercentage = 0;
    }

    calcRatingStats(post);
    await post.save();

    res.status(200).json({
      status: "success",
      message: existingRating
        ? "Értékelés sikeresen frissítve"
        : "Értékelés sikeresen létrehozva",
      data: {
        post
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyRatingForPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError("Nincs ilyen poszt", 404));
    }

    const myRating = post.ratings.find(
      (rating) => rating.user.toString() === req.user._id.toString()
    );

    res.status(200).json({
      status: "success",
      data: {
        rating: myRating || null
      }
    });
  } catch (err) {
    next(err);
  }
}