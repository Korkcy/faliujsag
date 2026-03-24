const Post = require('../models/postModel'); //Bekérjük a poszt modellt
const AppError = require('../utils/appError');

exports.onlyAuthorOrAdmin = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id); //Lekérjük a megadott posztot

        if(!post){ //Ha nem jött vissza a válaszban poszt
            return next(new AppError('A poszt nem létezik', 404));
        }

        const isAuthor = post.author.toString() === req.user._id.toString(); //A poszt author mezőjét, ami ObjectId, konvertáljuk stringre és összehasonlítjuk a request-ben szereplő user mező-vel, ami szintén egy stringre konvertált id. Ha megegyeznek, akkor true lesz az isAuthor
        const isAdmin = req.user.role === 'admin'; //True lesz az isAdmin, ha a request user mezőjében a felhasználó rendelkezik az 'admin' role-lal

        if(!isAuthor && !isAdmin){ //Ha isAuthor és isAdmin is false
            return next(new AppError('Nincs jogosultságod ehhez a művelethez', 403));
        }

        req.post = post; //A request-ben létrehozunk egy post mezőt, amiben eltároljuk a posztot

        next();

    } catch (err) {
        next(err);
    }
};