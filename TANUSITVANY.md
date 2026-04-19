Iktatószám: THU/2024/DEMO-V7-9921-FULL
Példányszám: 01/Eredeti

# TANÚSÍTVÁNY ÉS TESZTELÉSI KERETSZABÁLYZAT
**A TransportHU Szoftverinterfész Demo Verziójának Hivatalos Vizsgálatához**

**Kibocsátó:** Huszár Barnabás (egyéni fejlesztő / TransportHU projektvezető)
**Tárgy:** Demo verzió használati jogosultsága, technikai állapotrögzítése és jogi keretrendszere.

## I. PREAMBULUM
Jelen dokumentum (a továbbiakban: Tanúsítvány) célja a TransportHU elnevezésű, közösségi közlekedést támogató szoftverrendszer kísérleti (Demo) fázisának szabályozása. A TransportHU projekt egy olyan integrált megoldást kínál, amely a mesterséges intelligencia (AI) segítségével optimalizálja a személyszállítási útvonalakat, valamint közvetlen interfészt biztosít a jegy- és bérletértékesítési folyamatokhoz.

A dokumentum aláírásával az Átvevő (Tesztelő) tudomásul veszi, hogy a szoftver fejlesztés alatt álló termék, melynek egyes funkciói korlátozottak vagy hibás működést mutathatnak.

## II. TECHNIKAI ÁLLAPOTRÖGZÍTÉS ÉS ISMERT ANOMÁLIÁK
A fejlesztői csapat (a továbbiakban: Fejlesztő) rögzíti, hogy a demo verzió **1.7.5-ös változata** funkcionálisan stabil, azonban az alábbi modulok tesztelése során fokozott körültekintés szükséges:

### 2.1. Fizetési modul és Stripe integráció
A rendszer a Stripe Payments Europe, Ltd. tesztkörnyezetét (Sandbox) használja. **A korábban jelzett inkonzisztencia az összegek (front-end vs. Stripe) között a v1.7.5-ös verzióban javításra került.** A dinamikus árazási algoritmust és a kedvezménykezelési logikát összehangoltuk, a rendszer most már a pontos, kedvezményekkel módosított bruttó végösszeget továbbítja a fizetési kapu felé.

### 2.2. Térképi és menetrendi adatok integrációja
A szoftver architektúrája felkészült a GTFS és GTFS-Realtime adatok fogadására. Jelen fázisban a valós idejű adatszolgáltatás a MÁV-START Zrt. hivatalos API hozzáférésére vár. Ezen hozzáférés hiányában a térképi modul statikus adatokkal és szimulált pozíciókkal operál, ami az útvonaltervezés pontosságát befolyásolhatja.

### 2.3. Mesterséges Intelligencia (AI) Utazástervező
Az "AI Travel Advisor" modul nagynyelvű modelleket (LLM) használ a természetes nyelven érkező lekérdezések feldolgozására. A tesztelés során "Internal AI Error" típusú üzenetek fordulhatnak elő, amennyiben a lekérdezés bonyolultsága meghaladja a jelenlegi token-limitációt, vagy a bemeneti adat nem felel meg a strukturált paraméterezésnek.

## III. TESZTELÉSI HOZZÁFÉRÉS ÉS BIZTONSÁG
A Fejlesztő a tesztelési folyamat validálásához az alábbi specifikus adatokat biztosítja:
- **Tesztkártya tulajdonosa:** TransportHU Zrt.
- **Kártyaszám:** 4242 4242 4242 4242
- **Validitás:** 03/31
- **CVC:** 333

A tesztkártya adatai kizárólag a TransportHU tesztkörnyezetében érvényesek. Bármilyen egyéb célú felhasználási kísérlet a tesztelési jogosultság azonnali bevonását vonja maga után.

## IV. JOGI NYILATKOZATOK ÉS SZELLEMI TULAJDON
### 4.1. Szerzői jogok
A TransportHU szoftver teljes forráskódja, adatbázis-struktúrástructure-ja, algoritmusai és grafikai interfésze (UI/UX) Huszár Barnabás kizárólagos szellemi tulajdonát képezik. A tesztelés során kapott hozzáférés nem jelent tulajdonjog-átruházást vagy felhasználási licencet a tesztelési időszakon túl.

### 4.2. Védjegyhasználat korlátozása
A demo verzióban a MÁV-START Zrt. és a Budapesti Közlekedési Központ (BKK) védjegyei (logói) kizárólag az integrációs készség bemutatására szolgálnak. A tesztelő kifejezetten elismeri, hogy ezeket a logókat hivatalos forgalomban, marketing-kommunikációban vagy bármilyen nyilvános prezentációban nem használhatja fel a jogtulajdonosok előzetes, írásos jóváhagyása nélkül.

### 4.3. Titoktartási megállapodás (NDA)
A Tesztelő vállalja, hogy a tesztelés során megismert üzleti titkokat, technikai megoldásokat és a szoftver teljesítményére vonatkozó adatokat korlátlan ideig bizalmasan kezeli. Tilos a képernyőmentések, videófelvételek vagy technikai naplók (logok) közzététele a Fejlesztő engedélye nélkül.

## V. FELELŐSSÉGKORLÁTOZÁS
A Fejlesztő kifejezetten kizárja a felelősségét a demo verzió használatából eredő közvetlen vagy közvetett károkért, elmaradt haszonért vagy adatvesztésért. A szoftver "ahogy van" (as-is) állapotban kerül átadásra tesztelési célokra.

---
**Huszár Barnabás**  
Kibocsátó (Fejlesztő)

**Átvevő**  
(MÁV/BKK képviselője)

**TRANSPORT HU**  
*HIVATALOS IGAZOLÁS*  
**v1.7.5 STABIL DEMO**
