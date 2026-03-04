const express = require('express');
const answerController = require('../controllers/answerController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyAuthorOrAdminAnswer } = require('../middlewares/answerAuthMiddleware');

const router = express.Router();

router
  .route('/:id')
  .patch(protect, onlyAuthorOrAdminAnswer, answerController.updateAnswer)
  .delete(protect, onlyAuthorOrAdminAnswer, answerController.deleteAnswer);

module.exports = router;