const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    return new AppError(`Érvénytelen azonosító: ${err.value}`, 400);
};

const handlevalidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    return new AppError(`Érvénytelen adat(ok): ${errors.join('. ')}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.keyValue ? Object.values(err.keyValue).join(', ') : 'ismeretlen érték';
    return new AppError(`Duplikált mezőérték: ${value}. Kérlek használj másik értéket!`, 400);
};

const handleJWTError = () => {
    new AppError('Érvénytelen token. Kérlek jelentkezz be újra!', 401);
};

const handleJWTExpiredError = () => {
    new AppError('A token lejárt. Kérlek jelentkezz be újra!', 401);
};

const sendErrorDev = (err, req, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    });
};

const sendErrorProd = (err, req, res) => {
    if(err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    console.error('💥 PROGRAMMING ERROR:', err);

    return res.status(500).json({
        status: 'error',
        message: 'Valami hiba történt a szerveren.'
    });
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        return sendErrorDev(err, req, res);
    }

    let error = {...err};
    error.message = err.message;
    error.name = err.name;

    if(err.name === 'CastError') error = handleCastErrorDB(err);
    if(err.name === 'ValidationError') error = handlevalidationErrorDB(err);
    if(err.code === 11000) error = handleDuplicateFieldsDB(err);
    if(err.name === 'JsonWebTokenError') error = handleJWTError();
    if(err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
};