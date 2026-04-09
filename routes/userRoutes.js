const express = require('express');
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", protect, userController.getMe);
router.patch("/me", protect, userController.updateMe);
router.patch("/updateMyPassword", protect, userController.updateMyPassword);

router.get("/me/saved-posts", protect, userController.getSavedPosts);
router.get("/saved-posts/:postId", protect, userController.isPostSaved);
router.post("/saved-posts/:postId", protect, userController.savePost);
router.delete("/saved-posts/:postId", protect, userController.unsavePost);

router.get("/:id", userController.getUserById);

module.exports = router;