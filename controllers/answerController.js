const Answer = require("../models/answerModel");
const Post = require("../models/postModel");
const AppError = require("../utils/appError");

exports.getAnswersByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const answers = await Answer.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("author", "username school profilePicture");

    const answersArray = answers.map(answer =>{
      const obj = answer.toObject();
      obj.replies = [];
      return obj;
    });

    const answersMap = {};

    answersArray.forEach(answer => {
      answersMap[answer._id.toString()] = answer;
    });

    const rootAnswers = [];

    answersArray.forEach(answer => {
      if (answer.replyTo) {
        const parent = answersMap[answer.replyTo.toString()];

        if(parent){
          parent.replies.push(answer);
        } else {
          rootAnswers.push(answer);
        }
      } else {
        rootAnswers.push(answer)
      }
    })
    
    res.status(200).json({
      status: "success",
      results: rootAnswers.length,
      data: {
        answers: rootAnswers
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createAnswer = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const {text, replyTo} = req.body;

    const post = await Post.findById(postId);
    if (!post){
      return next(new AppError('Nincs ilyen poszt', 404));
    }

    if (replyTo){
      const parentAnswer = await Answer.findById(replyTo);

      if (!parentAnswer){
        return next(new AppError('A replyTo válasz nem létezik', 404));
      }

      if (parentAnswer.post.toString() !== postId){
        return next(new AppError('Csak ugyanahhoz a poszthoz tartozó válaszra lehet válaszolni', 400));
      }
    }

    const answer = await Answer.create({
      text,
      post: postId,
      author: req.user._id,
      replyTo: replyTo || null
    });

    await Post.findByIdAndUpdate(postId, {$inc: {answersCount: 1} });

    res.status(201).json({
      status: "success",
      data: {
        answer,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id).populate(
      "author",
      "username school profilePicture",
    );

    if (!answer) {
      return next(new AppError('Nincs ilyen válasz', 404));
    }

    res.status(200).json({
      status: "success",
      data: { answer },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAnswer = async (req, res, next) => {
  try {
    const allowedFields = ['text'];
    const filteredBody = {};
    allowedFields.forEach((field) => {
      if(req.body[field] !== undefined) filteredBody[field] = req.body[field];
    });

    const answer = await Answer.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    if (!answer) {
      return next(new AppError('Nincs ilyen válasz', 404));
    }

    res.status(200).json({
      status: "success",
      data: { answer },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findByIdAndDelete(req.params.id);

    if (!answer) {
      return next(new AppError('Nincs ilyen válasz', 404));
    };

    await Post.findByIdAndUpdate(answer.post, {$inc: {answersCount: -1} })

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.getCommentedPostsByMe = async (req, res, next) => {
  try {
    const answers = await Answer.find({ author: req.user._id}).select("post");

    const postIds = [...new Set(answers.map((answer) => answer.post.toString()))];

    const posts = await Post.find({ _id: { $in: postIds} })
      .sort({ createdAt: -1})
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