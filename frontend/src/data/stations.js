// Koordináták a pontos távolságméréshez (lat, lon)
export const STATION_DATA = {
  "Budapest-Keleti": { lat: 47.5005, lon: 19.0837 },
  "Budapest-Déli": { lat: 47.4913, lon: 19.0264 },
  "Budapest-Nyugati": { lat: 47.5105, lon: 19.0573 },
  "Kőbánya-Kispest": { lat: 47.4628, lon: 19.1494 },
  "Kelenföld": { lat: 47.4646, lon: 19.0208 },
  "Székesfehérvár": { lat: 47.1804, lon: 18.4231 },
  "Székesfehérvár-Repülőtér": { lat: 47.1650, lon: 18.4250 },
  "Győr": { lat: 47.6828, lon: 17.6353 },
  "Debrecen": { lat: 47.5204, lon: 21.6267 },
  "Szeged": { lat: 46.2393, lon: 20.1437 },
  "Pécs": { lat: 46.0691, lon: 18.2323 },
  "Miskolc-Tiszai": { lat: 48.1001, lon: 20.8066 },
  "Nyíregyháza": { lat: 47.9495, lon: 21.7100 },
  "Kecskemét": { lat: 46.9081, lon: 19.6934 },
  "Szolnok": { lat: 47.1662, lon: 20.1772 },
  "Tatabánya": { lat: 47.5684, lon: 18.4047 },
  "Veszprém": { lat: 47.1121, lon: 17.9157 },
  "Békéscsaba": { lat: 46.6811, lon: 21.0858 },
  "Sopron": { lat: 47.6814, lon: 16.5925 },
  "Zalaegerszeg": { lat: 46.8406, lon: 16.8465 },
  "Eger": { lat: 47.8894, lon: 20.3794 },
  "Siófok": { lat: 46.9061, lon: 18.0532 },
  "Balatonfüred": { lat: 46.9584, lon: 17.8814 },
  "Fonyód": { lat: 46.7431, lon: 17.5513 },
  "Keszthely": { lat: 46.7594, lon: 17.2483 },
  "Esztergom": { lat: 47.7801, lon: 18.7303 },
  "Vác": { lat: 47.7788, lon: 19.1356 },
  "Hatvan": { lat: 47.6625, lon: 19.6734 },
  "Cegléd": { lat: 47.1708, lon: 19.8003 },
  "Baja": { lat: 46.1821, lon: 18.9667 },
  "Szekszárd": { lat: 46.3533, lon: 18.7042 },
  "Salgótarján": { lat: 48.1028, lon: 19.8058 },
  "Dunakeszi": { lat: 47.6364, lon: 19.1294 },
  "Gödöllő": { lat: 47.5967, lon: 19.3514 },
  "Hajdúszoboszló": { lat: 47.4521, lon: 21.3934 }
};

export const STATIONS = Object.keys(STATION_DATA).sort();

// Extra fallback lista koordináták nélkül, ha a keresés nem találna lat/lon-t
export const FALLBACK_STATIONS = [
  "Zugló", "Ferencváros", "Érd", "Kaposvár", "Szentendre", "Szigetszentmiklós", "Budaörs", "Ajka", "Orosháza", 
  "Szentes", "Mosonmagyaróvár", "Kazincbarcika", "Jászberény", "Kiskunfélegyháza", "Kiskunhalas", 
  "Pápa", "Gyöngyös", "Gyula", "Komárom", "Veresegyház", "Pilisvörösvár", 
  "Balatonalmádi", "Balatonlelle", "Balatonboglár", "Tapolca", "Sümeg", "Zalaszentiván",
  "Bicske", "Biatorbágy", "Budafok", "Albertirsa", "Monor", "Pilis", "Üllő", "Kistarcsa", "Göd", "Nagymaros-Visegrád",
  "Szob", "Verőce", "Aszód", "Turura", "Vámosgyörk", "Püspökladány", "Karcag", "Kisújszállás", "Abony",
  "Mezőkövesd", "Nyékládháza", "Szerencs", "Tokaj", "Sárospatak", "Sátoraljaújhely", "Füzesabony", "Poroszló", "Tiszafüred"
];

export const ALL_STATIONS = [...new Set([...STATIONS, ...FALLBACK_STATIONS])].sort();
