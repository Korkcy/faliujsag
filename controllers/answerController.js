const Answer = require("../models/answerModel");
const Post = require("../models/postModel");

exports.getAnswersByPost = async (req, res) => {
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
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const { postId } = req.params;
    const {text, replyTo} = req.body;

    const post = await Post.findById(postId);
    if (!post){
      return res.status(404).json({
        status: 'fail',
        message: 'Nincs ilyen poszt'
      });
    }

    if (replyTo){
      const parentAnswer = await Answer.findById(replyTo);

      if (!parentAnswer){
        return res.status(404).json({
          status: 'fail',
          message: 'A replyTo válasz nem létezik'
        });
      }

      if (parentAnswer.post.toString() !== postId){
        return res.status(400).json({
          status: 'fail',
          message: 'Csak ugyanahhoz a poszthoz tartozó válaszra lehet válaszolni'
        });
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
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate(
      "author",
      "username school profilePicture",
    );

    if (!answer) {
      return res.status(404).json({
        status: "fail",
        message: "Nincs ilyen válasz",
      });
    }

    res.status(200).json({
      status: "success",
      data: { answer },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.updateAnswer = async (req, res) => {
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
      return res.status(404).json({
        status: "fail",
        message: "Nincs ilyen válasz",
      });
    }

    res.status(200).json({
      status: "success",
      data: { answer },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findByIdAndDelete(req.params.id);

    if (!answer) {
      return res.status(404).json({
        status: "fail",
        message: "Nincs ilyen válasz",
      });
    };

    await Post.findByIdAndUpdate(answer.post, {$inc: {answersCount: -1} })

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
