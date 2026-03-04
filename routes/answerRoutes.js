const express = require('express');
const answerController = require('../controllers/answerController');
const {protect} = require('../middlewares/authMiddleware');

const router = express.Router({mergeParams: true});

router
    .route('/')
    .get(answerController.getAnswersByPost)
    .post(protect, answerController.createAnswer);

module.exports = router;