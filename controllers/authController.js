const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const {signToken} = require('../utils/jwt');

exports.signup = async (req, res) => {
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
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.login = async (req,res)=>{
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email és jelszó megadása kötelező'
            });
        }

        const user = await User.findOne({email}).select('+password');

        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Hibás email vagy jelszó'
            });
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
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};