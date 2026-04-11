const AppError = require("../utils/appError");

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next( new AppError("nincs jogosultságod ehhez a művelethez", 403));
        }
        next();
    };
};