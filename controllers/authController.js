const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const {signToken} = require('../utils/jwt');
const AppError = require('../utils/appError');

exports.signup = async (req, res, next) => {
    try {
        const {email, username, password, passwordConfirm, school} = req.body;

        const newUser = await User.create({
            email,
            username,
            password,
            passwordConfirm,
            school
        });

        const token = signToken(newUser._id);

        res.status(201).json({
            status: 'success',
            token,
            message: 'Felhasználó sikeresen létrehozva',
            data: {
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    username: newUser.username
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req,res,next)=>{
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return next(new AppError('Email és jelszó megadása kötelező', 400));
        }

        const user = await User.findOne({email}).select('+password');

        if(!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError('Hibás email vagy jelszó', 401));
        }

        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            message: 'Sikeres bejelentkezés',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username
                }
            }
        });
    } catch (err) {
        next(err);
    }
};