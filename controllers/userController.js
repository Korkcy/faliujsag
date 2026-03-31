const User = require('../models/userModel');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');

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
        const {email, username, school, profilePicture} = req.body;

        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                email,
                username,
                school,
                profilePicture
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