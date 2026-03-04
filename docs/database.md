## Post modell

A Post modell egy felhasználó által feltett kérdést reprezentál.

## Fő mezők:
- title: a kérdés címe, amely a főoldalon jelenik meg
- description: a kérdés részletes leírása
- author: a kérdést feltevő felhasználó azonosítója (ObjectId)

### Statisztikai mezők:
- ratingsAverage: a kérdés hasznosságának átlaga (1–10)
- ratingsQuantity: értékelések száma
- answersCount: válaszok száma
- viewsCount: megtekintések száma

### Technikai megoldások:
- Mongoose schema validációk
- ObjectId referencia a User modellhez
- timestamps schema opció használatával automatikusan hozzáadjuk a createdAt és updatedAt mezőket is a schemához

## User modell

A User modell a rendszerben regisztrált felhasználókat reprezentálja.

### Fő mezők:
- email: a felhasználó email címe
  - egyedi
  - email formátum validációval
- username: a felhasználó megjelenített neve
  - egyedi
  - maximum 50 karakter
- password: a felhasználó jelszava
  - adatbázisban titkosítva kerül tárolásra
- role: a felhasználó jogosultsági szintje
  - lehetséges értékek: user, admin
- profilePicture: a felhasználó profilképe (URL)
- school: az iskola vagy intézmény neve

### Technikai megoldások:
- Mongoose schema validációk (required, minLength, enum)
- `validator` csomag használata email ellenőrzéshez
- Egyedi mezők (`unique`) használata az email és username mezőkön
- Jelszó titkosítás bcrypt segítségével (pre-save middleware)
- passwordConfirm mező csak validációra szolgál, nem kerül mentésre az adatbázisban

### Autentikáció
A rendszer JWT alapú autentikációt használ.
A token nem kerül tárolásra az adatbázisban,
a szerver a token aláírását ellenőrzi minden védett kérésnél.

### Kapcsolatok:
- A User modell kapcsolódik a Post modellhez (author mező ObjectId referencia)
- A lekérdezéskor a populate segítségével az author mező kibővíthető a User dokumentum mezőivel
- A populate nem módosítja az adatbázist, csak a válasz objektumot bővíti ki

## Answer modell:

### Fő mezők:

### Technikai megoldások:

### Kapcsolatok: