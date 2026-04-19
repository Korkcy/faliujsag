const express = require('express');
const answerController = require('../controllers/answerController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyAuthorOrAdminAnswer } = require('../middlewares/answerAuthMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware')

const router = express.Router();

router.get("/", protect, restrictTo("admin"), answerController.getAllAnswers);

router.get("/me/posts", protect , answerController.getCommentedPostsByMe);

router
  .route('/:id')
  .patch(protect, onlyAuthorOrAdminAnswer, answerController.updateAnswer)
  .delete(protect, onlyAuthorOrAdminAnswer, answerController.deleteAnswer);

module.exports = router;