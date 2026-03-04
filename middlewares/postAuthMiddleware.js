const Post = require('../models/postModel'); //Bekérjük a poszt modellt

exports.onlyAuthorOrAdmin = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id); //Lekérjük a megadott posztot

        if(!post){ //Ha nem jött vissza a válaszban poszt
            return res.status(404).json({ //Not found hibakód
                status: 'fail',
                message: 'A poszt nem létezik'
            });
        }

        const isAuthor = post.author.toString() === req.user._id.toString(); //A poszt author mezőjét, ami ObjectId, konvertáljuk stringre és összehasonlítjuk a request-ben szereplő user mező-vel, ami szintén egy stringre konvertált id. Ha megegyeznek, akkor true lesz az isAuthor
        const isAdmin = req.user.role === 'admin'; //True lesz az isAdmin, ha a request user mezőjében a felhasználó rendelkezik az 'admin' role-lal

        if(!isAuthor && !isAdmin){ //Ha isAuthor és isAdmin is false
            return res.status(403).json({ //Forbidden hibakód
                status: 'fail',
                message: 'Nincs jogosultságod ehhez a művelethez'
            });
        }

        req.post = post; //A request-ben létrehozunk egy post mezőt, amiben eltároljuk a posztot

        next();

    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};