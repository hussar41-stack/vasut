# 命️ TransportHU – Fejlesztési Dokumentáció v1.8.0

Ez a dokumentum átfogó képet ad a TransportHU alkalmazás felépítéséről, a forráskód szerkezetéről és a fejlesztési folyamatokról.

---

## 🏗️ 1. Architektúra és Technológiai Stáck

Az alkalmazás egy modern, moduláris felépítésű full-stack platform:

*   **Frontend**: React.js (Single Page Application)
*   **Backend**: Node.js + Express.js
*   **Mobile**: React Native + Expo
*   **Stílus**: Vanilla CSS Custom Properties (Design System alapú)
*   **Fizetés**: Stripe SDK szinkronizációval
*   **Deployment**: Vercel (Frontend), Render (Backend)

---

## 📂 2. Fájlszerkezet és Modulok

### 🖥️ Frontend (`/frontend/src/`)
*   **`pages/`**: Az alkalmazás fő nézetei (pl. `SchedulePage`, `PassesPage`, `AszfPage`). Itt található az üzleti logika nagy része.
*   **`components/`**: Újrafelhasználható UI elemek (pl. `HeroSlider`, `PurchaseModal`).
*   **`contexts/`**: Állapotkezelés (pl. `AuthContext` a bejelentkezéshez).
*   **`data/`**: Statikus adatkészletek, pl. `allStations.js` (1150+ vasútállomás).
*   **`api/`**: A backenddel való kommunikációt végző `client.js`.

### ⚙️ Backend (`/backend/src/`)
*   **`server.js`**: A belépési pont, middleware-ek és útvonalak regisztrációja.
*   **`routes/`**: API végpontok (pl. `realSearch.js`, `stripe.js`).
*   **`data/`**: Az ideiglenes (in-memory) adatbázis és a díjszabások.
*   **`services/`**: Külső szolgáltatások, pl. `newsService.js` (MÁV/BKK RSS).

---

## 🚂 3. Főbb Funkciók Megvalósítása

### 🔍 Menetrendi Kereső
A kereső az országos állomáslistából dolgozik. A backend koordináta-alapú távolságszámítást végez, ami alapján a hivatalos MÁV díjszabás szerint generál árakat minden magyarországi viszonylatra.

### 💳 Stripe Fizetési Folyamat
A fizetés kétlépcsős:
1.  **Frontend**: Összeállítja a jegy/bérlet adatokat és session-t kér.
2.  **Backend**: Validálja az árakat a belső díjszabás alapján, majd létrehozza a Stripe Checkout session-t.
3.  **Visszaigazolás**: Sikeres fizetés után a rendszer rögzíti a jegyet az `inMemoryStore`-ban.

---

## 🛠️ 4. Fejlesztési Folyamat

### Lokális futtatás
1.  **Backend**: `cd backend && npm start` (Port: 4000/5010)
2.  **Frontend**: `cd frontend && npm start` (Port: 3000)

### Környezeti változók (.env)
*   `STRIPE_SECRET_KEY`: Backend oldali titkos kulcs.
*   `REACT_APP_STRIPE_PUBLIC_KEY`: Frontend oldali publikus kulcs.
*   `REACT_APP_API_URL`: A backend elérhetősége.

---

## 📈 5. Jövőbeli Irányok
*   **Perzisztens Adatbázis**: Átállás PostgreSQL-re vagy MongoDB-re.
*   **Hivatalos API**: Csatlakozás a MÁV-Start API-hoz.

---
*Dokumentáció frissítve: 2024. 04. 19.*
