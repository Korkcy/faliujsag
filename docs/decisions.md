## Miért használunk MongoDB-t?

- A projekt adatstrukturája rugalmas, a kérdések és válaszok kapcsolata jól kezelhető dokumentum alapú adatbázisban.
- Mivel Node.js-t használunk, ami JavaScript alapú, ezért kézenfekvő egy szintén JavaScript-re épülő adatbázis használata.
- Jobban preferáljuk a noSQL adatbázisokat.

# Tervezési döntések (decisions.md)

## Backend architektúra
A projekt MVC-szerű felépítést használ:
- modellek: adatstruktúra (Mongoose schema)
- controller: üzleti logika
- router: végpontok kezelése

Ez a felosztás átláthatóbbá és bővíthetőbbé teszi a kódot.

## Adatbázis
MongoDB + Mongoose került kiválasztásra, mert:
- jól illeszkedik a JavaScript alapú stackhez
- gyors prototípus készítést tesz lehetővé
- rugalmas sémakezelést biztosít

## API verziózás
Az API útvonalak `/api/v1/` prefixet használnak,
hogy a későbbiekben visszafelé kompatibilis módon bővíthetők legyenek.

## Frontend tesztelés
Egyszerű HTML + JavaScript frontend készült,
amely fetch API-n keresztül kommunikál a backenddel.
Ez lehetővé teszi az API működésének gyors tesztelését grafikus felületről.

## Dokumentáció
- api.md: publikus REST API végpontok
- dev-log.md: felhasználói dokumentáció
- decisions.md: tervezési döntések indoklása
- database.md: adatbázis modellek leírása
- backend-progress.md: fejlesztési lépések

## Autentikációs stratégia

A rendszer stateless JWT alapú autentikációt használ.

Indoklás:
- Nem szükséges session adatokat tárolni a szerveren
- Skálázható megoldás
- REST API-k esetében ipari standard megközelítés
- A token digitális aláírással védett (JWT_SECRET)

## Route védelem

A védett végpontok middleware segítségével kerülnek hitelesítésre.

- A protect middleware minden védett kérés előtt ellenőrzi a JWT tokent és csak érvényes hitelesítés után engedi lefutni a kérést
- Ez biztosítja, hogy csak bejelentkezett felhasználók hozhassanak létre, módosíthassanak vagy törölhessenek posztot
- A szerző mező a backend oldalon kerül beállításra, így kliens oldalról nem manipulálható