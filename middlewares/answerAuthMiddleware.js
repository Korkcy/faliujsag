const Answer = require('../models/answerModel');

exports.onlyAuthorOrAdminAnswer = async (req, res, next) => {
    try {
        const answer = await Answer.findById(req.params.id);

        if(!answer){
            return res.status(404).json({
                status: 'fail',
                message: 'A válasz nem létezik'
            });
        }

        const isAuthor = answer.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if(!isAuthor && !isAdmin){
            return res.status(403).json({
                status: 'fail',
                message: 'Nincs jogosultságod ehhez a művelethez'
            });
        }

        req.answer = answer;
        next();
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};