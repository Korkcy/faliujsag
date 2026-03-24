const Answer = require('../models/answerModel');
const AppError = require('../utils/appError');

exports.onlyAuthorOrAdminAnswer = async (req, res, next) => {
    try {
        const answer = await Answer.findById(req.params.id);

        if(!answer){
            return next(new AppError('A válasz nem létezik', 404));
        }

        const isAuthor = answer.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if(!isAuthor && !isAdmin){
            return next(new AppError('Nincs jogosultságod ehhez a művelethez', 403));
        }

        req.answer = answer;
        next();
    } catch (err) {
        next(err);
    }
};