const User = require("../models/userModel");
const {verifyToken} = require("../utils/jwt");  

exports.protect = async (req, res, next) => {
    try {
        let token; 

        const authHeader = req.headers.authorization; 

        if (authHeader && authHeader.startsWith('Bearer ')) { 
            token = authHeader.split(' ')[1]; 
        };

        if (!token){ 
            return res.status(401).json({
                status: 'fail',
                message: 'Nem vagy bejelentkezve! (hiányzó token)'
            });
        };

        const decoded = verifyToken(token); 

        const currentUser = await User.findById(decoded.id); 

        if(!currentUser){ 
            return res.status(401).json({
                status: 'fail',
                message: 'A tokenhez tartozó felhasználó nem létezik'
            });
        };

        req.user = currentUser; 

        next();

    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token'
        });
    }
};