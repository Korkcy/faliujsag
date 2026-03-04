# Faliújság API dokumentáció

Ez a dokumentum a backend REST API végpontjait írja le.

---

## Posts (Kérdések)

### GET /api/v1/posts
Az összes kérdés lekérése az adatbázisból.

**Leírás:**
Visszaadja az összes posztot, amelyet a felhasználók hoztak létre.

**Request:**
- Method: GET
- URL: /api/v1/posts
- Body: nincs

**Response (200):**
```json:
{
  "status": "success",
  "results": 1,
  "data": {
    "posts": [
      {
        "_id": "...",
        "title": "Tényleg nehéz a BME?",
        "description": "...",
        "ratingsAverage": 8.5,
        "answersCount": 3,
        "viewsCount": 120,
        "createdAt": "..."
      }
    ]
  }
}
```

### POST /api/v1/posts
Új kérdés létrehozása.

**Leírás:**
Új posztot hoz létre a megadott adatok alapján, és elmenti az adatbázisba.

**Request:**
- Method: POST  
- URL: /api/v1/posts
- Headers: Content-Type: application/json
- Body: 
```json:
{
  "title": "Mennyire nehéz az emelt matek érettségi?",
  "description": "Milyen feladatokra lehet számítani?",
  "author": "ObjectId"
}
```

**Response(201):**
```json: 
{
  "status": "success",
  "data": {
    "post": {
      "_id": "...",
      "title": "...",
      "description": "...",
      "createdAt": "..."
    }
  }
}
```

### GET /api/v1/posts/:id
Id alapú lekérés az adatbázisból.

**Leírás**
Megadott id alapján lekéri az eggyező dokumentumot az adatbázisból

**Request**
- Method: GET
- URL: /api/v1/posts/:id
- Body: nincs

**Response (200):**
```json:
{
  "status": "success",
  "results": 1,
  "data": {
    "posts": [
      {
        "_id": "...",
        "title": "Tényleg nehéz a BME?",
        "description": "...",
        "ratingsAverage": 8.5,
        "answersCount": 3,
        "viewsCount": 120,
        "createdAt": "..."
      }
    ]
  }
}
```

### PATCH /api/v1/posts/:id

### DELETE /api/v1/posts/:id

---

## Users (Felhasználók)

## Auth

### POST /api/v1/auth/signup
Új felhasználó regisztrációja.

**Leírás**
A felhasználó profilt hoz létre email, felhasználónév és jelszó megadásával. Opcionális információkat is adhat meg mint például iskolát.

**Request:**
- Method: POST  
- URL: /api/v1/auth/signup
- Headers: Content-Type: application/json
- Body: 
```json:
{
  "email": "tesztuser2@gmail.com",
  "username": "tesztuser2",
  "password": "titkosjelszo12345",
  "passwordConfirm": "titkosjelszo12345",
  "school": "Elte"
}
```

**Response (200):**
```json:
{
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OTFiOWMxN2I4NzNmMmZjNDFkMThkNCIsImlhdCI6MTc3MTE1Nzk1NCwiZXhwIjoxNzc4OTMzOTU0fQ.5DaHrHsRcLeAnB3_2-bJxU9Ge12DEgd1PWzCTdf0CSs",
    "message": "Felhasználó sikeresen létrehozva",
    "data": {
        "user": {
            "id": "6991b9c17b873f2fc41d18d4",
            "email": "tesztuser2@gmail.com",
            "username": "tesztuser2"
        }
    }
}
```

### POST /api/v1/auth/login
Felhasználó belépése

**Leírás**
A felhasználó a megadott email címével és jelszavával beléphet profiljába.

**Request:**
- Method: POST  
- URL: /api/v1/auth/login
- Headers: Content-Type: application/json
- Body: 
```json:
{
  "email": "tesztuser2@gmail.com",
  "password": "titkosjelszo12345"
}
```

**Response (200):**
```json:
{
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OTFiOWMxN2I4NzNmMmZjNDFkMThkNCIsImlhdCI6MTc3MTE1ODcwNSwiZXhwIjoxNzc4OTM0NzA1fQ.McC6flKtd8w6yKnrl5fuv-kf0t849ss_nbFSbKAMk2o",
    "message": "Sikeres bejelentkezés",
    "data": {
        "user": {
            "id": "6991b9c17b873f2fc41d18d4",
            "email": "tesztuser2@gmail.com",
            "username": "tesztuser2"
        }
    }
}
```

## Minden új endpoint után frissítjük az API dokumentációt