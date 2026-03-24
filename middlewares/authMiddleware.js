const User = require("../models/userModel");
const AppError = require("../utils/appError");
const {verifyToken} = require("../utils/jwt");  

exports.protect = async (req, res, next) => {
    try {
        let token; 

        const authHeader = req.headers.authorization; 

        if (authHeader && authHeader.startsWith('Bearer ')) { 
            token = authHeader.split(' ')[1]; 
        };

        if (!token){ 
            return next(new AppError('Nem vagy bejelentkezve (hiányzó token)', 401));
        };

        const decoded = verifyToken(token); 

        const currentUser = await User.findById(decoded.id); 

        if(!currentUser){ 
            return next(new AppError('A tokenhez tartozó felhasználó nem létezik', 401));
        };

        req.user = currentUser; 

        next();

    } catch (err) {
        return next(new AppError('Invalid token', 401));
    }
};