# backend fejlesztési napló

## 2026-01-27 Létrehozások, adatbázis összekötés, server.js, config.env, file struktúra létrehozása mvc alkalmazásával, npm inicializálás és package-ek letöltése

- File struktúra létrehozva (Faliujsag mappa -> controllers, dev-data, docs, models, public, routes, utils, views, config.env, server.js)
- Npm inicializálása (npm init -y)
- Npm packagek letöltése (npm i express dotenv mongoose morgan nodemon slugify)
- Projekt inicializálása (Node.js, Express)
- MongoDB Atlas összeköttetése a projekttel
- Környezeti változók beállítása (dotenv)
- Mongoose kapcsolat létrehozva

Megjegyzés: 
A MongoDB kapcsolat felépült, a kapcsolat állapotát console.log segítségével ellenőriztem

## 2026-01-31 Teszt frontend bemásolása a public mappába, app.js megírása, validator npm letöltése, első futás teszt, próba poszt kiiratás

- ChatGPT által létrehozott teszteléshez alkalmazott frontend beillesztése a "test" nevű mappába a public mappán belül
- main mappa létrehozása a publicon belül a jövőbeli kész frontendnek
- Express alkalmazás létrehozva (app.js)
- Morgan middleware hozzáadva a fejlesztői környezethez (HTTP request logolás)
- JSON body parser beállítva (req.body-n elérhető a request body)
- Statikus file-ok kiszolgálása a public mappából (express.static)
- Request idő mérése middleware segítségével (req.requestTime)
- Validator npm letöltve, későbbi adat ellenőrzéshez lesz majd szükséges (npm i validator)
- npm start segítségével szerver indítása, szerver fut, kiszolgálja a public mappát megfelelően
- postRoutes.js megírása, első route, 2 próba poszt dokumentumot tartalmaz, amiket a teszt frontend segítségével le is lehet kérni, de /api/posts route on magában is elérhető

## 2026-02-01 Poszt modell, poszt controller, teszt a próba frontend-del

- Első modell megírása, a posztokhoz, a modell tartalmazza a poszt metaadatait(cím, leírás, dátum), statisztikáit(megtekintések, válaszok, értékelés) és kapcsolatait(szerző, válaszok)
- A modell mezőiben meg van határozva a mező típusa, hogy kötelező-e értéket adni neki, rendelkeznek alap beállított értékekkel és tartalmaz validációt is
- A modell egy mongoose séma alapján jön létre, amit aztán exportálunk
- A postController.js megírása, először egy getAllPosts metódus, ami lekéri az adatbázisból az összes posztot, majd egy createPost metódus, ami új posztot hoz létre az adatbázisban
- A controller összekötve a router-rel, /-es útvonalon get és post kérésekre kötve a megfelelő metódussal
- Az api működését Postman segítségével teszteltem, a POST kérés létrehozza az új dokumentumot, a GET kérés pedig lekéri az adatbázis összes dokumentumát
- Az api működését a teszt frontenden is leteszteltem, ott is helyesen működik

## 2026-02-03 Poszt controller kiegészítése

- getPost, updatePost és deletePost metódusok megírása, ezzel megvalósul a CRUD, mostmár teljesen
- tesztelés Postman segítségével

## 2026-02-04 User modell tervezés és biztonsági alapok

- User mongoose schema megírása
- Alap felhasználói adatok definiálása (email, username, password, role, profilePicture, school)
- Email validáció validator npm csomaggal
- Email és username egyedi unique:true beállítással
- Jogosultsági szintek előkészítése ('role' mező segítségével)
- Jelszó megerősítés (passwordConfirm) logikai validációval
- Jelszó titkosítás koncepció bcrypt npm csomag használatával
- Mongoose pre-save document middleware, jelszó hash-elésére, figyelve arra, hogy már hash-elt jelszót ne hash-eljünk újra

Megjegyzés: A tényleges regisztrációs és autentikációs logika az authController-ben és JWT-ben kerül megvalósításra.

## 2026-02-08 authController és authRoutes

- Az authController megírása
- A controllerben két metódus elkészítése, signup a felhasználó létrehozáshoz és login a már meglévő felhasználóba való belépéshez, email és jelszó alapján
- Az authRoutes megírása
- /login és /signup endpointokra meghívjuk a megfelelő metódust a kontrollerből
- Postman segítségével tesztelve a megfelelő működés

## 2026-02-12 JWT npm package telepítése config.env kiegészítés

- npm i jsonwebtoken paranccsal, JWT letöltése
- A JWT-t token létrehozásához fogjuk használni, hogy ellenőrizhető legyen a user bejelentkezési állapota, csak a saját posztjait tudja a user törölni és lehessenek jogosultságok
- Kiegészítettem a config.env-et egy JWT_SECRET és egy JWT_EXPIRES_IN változóval
- Ha a JWT_SECRET (aláírás, titkos kulcs) jelen van a tokenben, csak akkor lesz a token valid, minden ellenkező esetben a szerver azonnal elutasítja majd a tokent
- A JWT_EXPIRES_IN mutatja hogy mennyi idei érvényes a token, a token nem örök érvényességű, egy idő után újra be kell majd jelentkezni
- Létrehoztam a utils mappába egy jwt.js fájl-t amibe majd a tokengenerálás kerül, külön a controllertől, mivel ez nem controller logika

## 2026-02-15 token generálás implementálása és hozzákötése az authControllerhez

- A jwt.js-ben bekértem a jsonwebtoken npm-et
- A jwt.js-ben kettő exports-ot írtam a signToken-t és a verifyToken-t.
- A signToken felelős a token létrehozásáért, minden alkalommal, amikor meghívásra kerül, létrehoz egy token-t ami tartalmazza a felhasználó id-jét, a titkos aláírást a hamis token létrehozásának elkerülése érdekében és a token lejáratának idejét. Erre az authControllerben van szükség.
- A verifyToken felelős azért, hogy ellenőrizze az aláírás jelenlétét és azt hogy a token még érvényes-e. Amennyiben az ellenőrzés sikeres, akkor visszaadja a token payload-ját (pl. userId). Ezt a protect middleware alkalmazza, a userModel-en belüli validációhoz.
- Az authController signup és login metódusában is elhelyztem a bekért signToken-t, a megfelelő formában
- A token generálás hiteles működését Postman segítségével leteszteltem. Regisztrációnál és bejelentkezésnél és látható a válaszban a token. A token-t az adatbázisban nem mentjük el.

## 2026-02-19 protect middleware létrehozása

- Létrehoztam a middlewares mappát és abban az authMiddleware-t.
- Az authMiddleware tartalmazza a protect middleware-t.
- A protect middleware kiolvassa az Authorization header-ből a Bearer tokent és ellenőrzi annak érvényességét a jwt.js-ben írt verifyToken függvény segítségével.
- A token payload alapján lekéri a felhasználót az adatbázisból és elhelyezi a req.user objektumban.
- Hiba esetén a middleware 401-es státuszkódu hibával válaszol.
- A postRoutes fájlban a POST, PATCH és DELETE végpontokat a protect middleware-rel védjük.
- A postController createPost metódusában a szerző mezőt automatikusan kitöltjük a req.user._id alapján.
- A rendszer működését Postman-ben teszteltem.

## 2026-02-21 poszt frissítés és törlési jogosultságok logikájának implementálása, postController egyszerűsítés

- A middlewares mappában létrehoztam egy postAuthMiddleware.js fájlt.
- Ez a fájl tartalmazza az onlyAuthorOrAdmin middleware-t.
- Ez a middleware felelős a posztok frissítése és törlése előtti jogosultsági validációért.
- A middleware leteszteli hogy a bejelentkezett user id-ja megegyezik-e a poszt létrehozójának az id-jával vagy hogy a user rendelkezik-e admin jogosultsággal.
- Ha ezek közül valamelyik igen, akkor a kérés végrehajtódik.
- Ha a felhasználó id nem egyezik és a felhasználó nem admin, akkor a middleware megakadályozza a kérés lefutását.
- A middleware elmenti a posztot a req.post mezőben.
- Az onlyAuthorOrAdmin middleware-t bekötöttem a postRoutes-ban, a protect middleware után, mivel csak bejelentkezett felhasználó esetén futhat le.
- Ezután a postControllerben, az onlyAuthorOrAdmin middleware által érintett endpointoknál kihasználtam a req.post nyújtotta előnyöket, hogy ne legyen egy kérésnél 2 adatbázis lekérdezés.
- A működést próba poszt létrehozásával, frissítésével és törlésével teszteltem Postman-ben

## 2026-02-25 Author populate

- A postController getAllPosts és getPost metódusait kiegészítettem populate használatával.
- Az author mező (ObjectId) most már nem csak azonosítót ad vissza, hanem a kapcsolódó User dokumentum kiválasztott mezőit is.
- Fontos, hogy a populate csak a választ módosítja, az adatbázisban továbbra is kizárólag az ObjectId marad elmentve.
- A működést Postman segítségével teszteltem.

## 2026-03-02 Answer model létrehozása

- Létrehoztam az answerModel.js-t, ami az Answer mongoose sémát tartalmazza.
- Célja a posztokra érkezett válaszok tárolása.
- Beállítottam a fő mezőket: text, post (kapcsolat a Post modelre), author (kapcsolat a User modelre) és timestamps a schema opciókban.
- Beállítottam nem kötelező mezőket is: likes, replyTo (kapcsolat az Answer modelre, válaszra válasz) és isDeleted.
- A post és author mezőhöz indexeket adtam, hogy a lekérdezések gyorsabbak legyenek
- Létrehoztam egy compund indexet: {post: 1, createdAt: -1}, amely optimalizálja a poszthoz tartozó válaszok lekérését, a legújabb előre sorolásával.
- Az isEdited állapotot nem tárolom az adatbázisban, hanem egy virtual mezőként számolom: createdAt és updatedAt összehasonlításával.
- A schema toJSON/toObject beállításával elértem, hogy a virtual mező (isEdited) megjelenjen a válasz JSON kimenetében is.

## 2026-03-04 Answer CRUD és GitHub repository

- Megírtam az answerControllert, ami felelős a válaszok CRUD-jának megvalósításáért. 
- A controller 4 használatba kerülő api endpointot tartalmaz, egy poszthoz tartozó válaszok lekérésére, válasz létrehozására, frissítésére és törlésére.
- Választ csak bejelentkezve lehet létrehozni és csak az author vagy az admin törölhet egy választ.
- Az updateAnswer metóduson belül whitelist-eltem, hogy a felhasználó mit módosíthat egy válaszban, ez csak a szöveg tartalma. 
- A válaszok számának automatikus frissítését is implementáltam, így amikor egy posztra érkezik egy válasz, a válaszok száma nő, ha egy választ törölnek, akkor pedig csökken
- Emellett létrehoztam a projekt központi GitHub repository-ját és a bakcend teljes jelenlegi állapotát elmentettem.
- A repository tartalmazza a backend mappastruktúrját.
- Egy .gitignore fájlban meghatároztam, hogy a node modulok, a config.env és a log fájlok ne kerüljene mentésre, biztonsági és tárhely megtakarítási szempontból.

## 2026-03-10 Keresőfunkció implementálása

- A postController getAllPosts metódusát kibővítettem kulcsszó alapú kereséssel.
- A keresés query paraméter segítségével történik: /api/v1/posts?search=ELTE.
- A kereső jelenleg a posztok címében és leírásában keres.
- A megvalósítás MongoDB regex alapú szűréssel készült.
- A keresés kis- és nagybetű független.

## 2026-03-16 Reply thread implementálása az answers rendszerhez

- Az Answer modell meglévő replyTo mezőjét felhasználva implementáltam a válaszokra érkező válaszok (reply thread) logikáját.
- A createAnswer metódus kibővítésre került:
  - ha a kérés body-ja tartalmaz replyTo mezőt, akkor a létrehozott answer egy másik válaszra válaszol
  - ellenőrzésre kerül, hogy a replyTo-ban megadott Answer létezik-e
  - ellenőrzésre kerül, hogy a parent Answer ugyanahhoz a poszthoz tartozik-e
- A getAnswersByPost metódus módosításra került:
  - az Answer dokumentumokat a backend threadelt fa struktúrába rendezi
  - a root válaszok külön tömbbe kerülnek
  - a child válaszok a parent replies mezőjébe kerülnek
- A threadelt válaszstruktúra lehetővé teszi, hogy a frontend később egyszerűbben jelenítse meg a nested beszélgetéseket.
- A működést Postman segítségével teszteltem.

## 2026-03-23 Global Error Handler implementálása

- Létrehoztam egy központi hibakezelő middleware-t (errorMiddleware.js).
- A middleware egységes formátumban kezeli a hibákat (status, message).
- Az app.js-ben a route-ok után bekötésre került.
- A controllerekben, az eddigi hibákat átalakítottam, hogy a központi hibakezelőt használják (next(err)).
- Létrehoztam az AppError osztályt, egyedi hibák kezelésére.

## 2026-03-25 Frontend első verzió, posztok megjelenítése az adatbázisból

- Létrehoztuk a főoldalt, index.html-t és a hozzá tartozó, index.js-t
- A főoldalon, megjelennek a posztok az adatbázisból
- A posztokat meg lehet nyitni és megjelennek a poszthoz tartozó adatok, mint az author, létrehozás dátuma, válaszok száma és a válaszok tartalma
- Dark mód implementálva, lokálisan elmenti a keresőben hogy éppen be van-e kapcsolva
- Search bar is lett létrehozva, de még nem funkcionális
- A posztok létrehozására, van egy gomb, ez sem működik, még
- A posztok szűrésére is vannak gombok, lehet majd a sorrendet állítani, válaszok száma alapján, értékelések alapján

## 2026-03-26 Bejelentkezés, regisztráció, profil oldal, design, pagination, sorting

- A postController getAllPosts metódusát kibővítettem pagination és sorting támogatással.
- A query paraméterek: page, limit, sort, search
- A támogatott rendezési módok: newest, answers, rated
- A keresés továbbra is a címben és leírásban történik.
- A válaszban visszaadásra kerül: aktuális oldal, összes találat, összes oldal száma
- A főoldali search inputot összekötöttem a backend search query paraméterével.
- A Newest, Most answers és Top rated gombok most már a backend sort query paraméterét használják.
- A frontend már nem lokálisan rendezi a posztokat, hanem a backendtől a rendezett adatokat kapja vissza.
- A lekérésekhez a frontend automatikusan page és limit paramétereket is küld.
- Elkészült a bejelentkezés és a regisztációs oldal, ahol email címet, jelszót, felhasználónevet kell megadni
- Elkészült a profil oldal is, ahol lehetősége van egy felhasználónak arra, hogy frissítse a felhasználónevét, jelszavát, email-jét, emellett megjelennek a saját posztjai is
- Elkészült az oldal logója is