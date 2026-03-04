const express = require("express");
const postController = require("../controllers/postController");
const {protect} = require("../middlewares/authMiddleware");
const {onlyAuthorOrAdmin} = require("../middlewares/postAuthMiddleware");
const answerRouter = require('./answerRoutes');

const router = express.Router();

router.use('/:postId/answers', answerRouter)

router
  .route("/")
  .get(postController.getAllPosts)
  .post(protect, postController.createPost);

router
  .route("/:id")
  .get(postController.getPost)
  .patch(protect, onlyAuthorOrAdmin, postController.updatePost)
  .delete(protect, onlyAuthorOrAdmin, postController.deletePost);

module.exports = router;