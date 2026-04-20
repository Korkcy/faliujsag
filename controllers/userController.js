const User = require('../models/userModel');
const Post = require('../models/postModel');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res, next) => {
    try {
        const { search } = req.query;

        const filter = {};

        if (search && search.trim()) {
            filter.$or = [
                { username: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .select("username email school role isBanned profilePicture createdAt");

        res.status(200).json({
            status: "success",
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.banUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return next(new AppError("A felhasználó nem található", 404));
        }

        if (user.role === "admin") {
            return next(new AppError("Admin felhasználó nem tiltható ki", 400));
        }

        user.isBanned = true;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: "success",
            message: "Felhasználó sikeresen kitiltva",
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.unbanUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return next(new AppError("A felhasználó nem található", 404));
        }

        user.isBanned = false;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: "success",
            message: "Felhasználó kitiltása feloldva",
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.searchUsers = async (req, res, next) => {
    try {
        const search = req.query.search?.trim();

        if (!search) {
            return res.status(200).json({
                status: "success",
                results: 0,
                data: {
                    users: []
                }
            });
        }

        const users = await User.find({
            username: { $regex: search, $options: "i" },
            isBanned: { $ne: true }
        })
        .select("username school profilePicture bio role")
        .limit(10);

        res.status(200).json({
            status: "success",
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return next(new AppError("A felhasználó nem található", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }
}

exports.updateMe = async (req, res, next) => {
    try {
        const {email, username, school, profilePicture, bio} = req.body;

        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                email,
                username,
                school,
                profilePicture,
                bio
            },
            {
                new: true,
                runValidators: true
            }
        ).select("+password");

        if(!updateUser) {
            return next(new AppError("A felhasználó nem található", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                user: updateUser
            }
        });
    } catch (err) {
        next(err);
    }
}

exports.updateMyPassword = async (req, res, next) => {
    try {
        const {currentPassword, newPassword, newPasswordConfirm} = req.body;

        const user = await User.findById(req.user._id).select("+password");

        if(!user){
            return next(new AppError("A felhasználó nem található", 404));
        }

        const isCorrect = await bcrypt.compare(currentPassword, user.password);

        if(!isCorrect){
            return next(new AppError("A jelenlegi jelszó hibás", 401));
        }

        if(newPassword !== newPasswordConfirm) {
            return next(new AppError("Az új jelszavak nem egyeznek", 400));
        }

        user.password = newPassword;
        user.passwordConfirm = newPasswordConfirm;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Jelszó sikeresen frissítve"
        });
    } catch (err) {
        next(err);
    }
}

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user){
            return next(new AppError("A felhasználó nem található", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }
}

exports.getSavedPosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'savedPosts',
            populate: {
                path: 'author',
                select: 'username school profilePicture role'
            }
        });

        if(!user){
            return next(new AppError("A felhasználó nem található", 404));
        }

        res.status(200).json({
            status: "success",
            results: user.savedPosts.length,
            data: {
                posts: user.savedPosts
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.savePost = async (req, res, next) => {
    try {
        const {postId} = req.params;

        const post = await Post.findById(postId);
        if(!post){
            return next(new AppError("Nincs ilyen poszt", 404));
        }

        const user = await User.findById(req.user._id);

        const alreadySaved = user.savedPosts.some(
            savedPostId => savedPostId.toString() === postId
        );

        if(alreadySaved){
            return next(new AppError("Ez a poszt már el van mentve", 400));
        }

        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: {savedPosts: postId}},
            {new: true}
        );

        res.status(200).json({
            status: "success",
            message: "Poszt elmentve",
            data: {
                savedPosts: updateUser.savedPosts
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.unsavePost = async (req, res, next) => {
    try {
        const {postId} = req.params;

        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { savedPosts: postId } },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            message: "Poszt eltávolítva a mentettek közül",
            data: {
                savedPosts: updateUser.savedPosts
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.isPostSaved = async (req, res, next) => {
    try {
        const {postId} = req.params;

        const user = await User.findById(req.user._id);

        const isSaved = user.savedPosts.some(
            savedPostId => savedPostId.toString() === postId
        );

        res.status(200).json({
            status: "success",
            data: {
                isSaved
            }
        });
    } catch (err) {
        next(err);
    }
}