import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '10px' }}>Adatkezelési Tájékoztató - TransportHU</h1>
        <p style={{ color: '#3b82f6', fontWeight: '600' }}>Hatályos: 2024. május 22-től</p>
      </header>

      <section style={{ marginBottom: '30px' }}>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          Ez az Adatkezelési Tájékoztató a TransportHU közösségi közlekedés tervező oldal (a továbbiakban: Weboldal) 
          felhasználóinak személyes adataira vonatkozó kezelési szabályait tartalmazza, 
          az Európai Unió Általános Adatvédelmi Rendeletével (GDPR) összhangban.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>1. Az Adatkezelő adatai</h2>
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong>Név:</strong> Huszár Barnabás (fejlesztő)</p>
          <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong>E-mail cím:</strong> hbgmunka@gmail.com</p>
          <p style={{ color: '#cbd5e1' }}><strong>Telefonszám:</strong> +36 70 327 0059</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>2. A kezelt adatok köre, célja és jogalapja</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Adat típusa</th>
                <th style={{ padding: '12px' }}>Adatkezelés célja</th>
                <th style={{ padding: '12px' }}>Jogalap</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>Helymeghatározási adatok</td>
                <td style={{ padding: '12px' }}>Az aktuális pozíció alapján történő útvonaltervezés biztosítása.</td>
                <td style={{ padding: '12px' }}>A felhasználó kifejezett hozzájárulása (böngésző engedélyezése).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>E-mail cím és jelszó</td>
                <td style={{ padding: '12px' }}>Regisztráció, a felhasználói fiók azonosítása és kapcsolattartás.</td>
                <td style={{ padding: '12px' }}>Szerződés teljesítése (a szolgáltatás igénybevétele).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px' }}>Mentett kedvenc útvonalak</td>
                <td style={{ padding: '12px' }}>A felhasználói élmény javítása, korábbi keresések gyors elérése.</td>
                <td style={{ padding: '12px' }}>A felhasználó hozzájárulása az adatok elmentésével.</td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>IP-cím és sütik (Cookies)</td>
                <td style={{ padding: '12px' }}>Az oldal technikai működésének biztosítása és statisztikai elemzések.</td>
                <td style={{ padding: '12px' }}>Jogos érdek és hozzájárulás.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>3. Az adatkezelés időtartama</h2>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>Helyadatok:</strong> Kizárólag az aktuális tervezési folyamat végéig kezeljük, nem tároljuk hosszú távon.</li>
          <li><strong>Regisztrációs adatok és kedvencek:</strong> A felhasználói fiók törléséig, vagy a felhasználó törlési kérelméig tároljuk.</li>
          <li><strong>Technikai naplók:</strong> A rögzítéstől számított maximum 30 napig kerülnek tárolásra biztonsági okokból.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>4. Adatbiztonsági intézkedések</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '10px' }}>Mindent megteszünk az adatok biztonsága érdekében:</p>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>A jelszavakat titkosított (hash-elt) formában tároljuk.</li>
          <li>A kommunikáció a Weboldal és a szerver között HTTPS protokollon keresztül zajlik.</li>
          <li>Harmadik félnek személyes adatokat (pl. e-mail cím) nem adunk el.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>5. Adatfeldolgozók</h2>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>Tárhelyszolgáltató (szerver biztosítása).</li>
          <li>Térképszolgáltatók (pl. Google Maps API, Mapbox) - az útvonaltervezéshez szükséges technikai adatok kezelése.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>6. A felhasználók jogai</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '10px' }}>Ön bármikor élhet az alábbi jogokkal a <strong>hbgmunka@gmail.com</strong> címen:</p>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>Hozzáférés:</strong> Tájékoztatást kérhet adatai kezeléséről.</li>
          <li><strong>Helyesbítés:</strong> Kérheti adatai javítását.</li>
          <li><strong>Törlés:</strong> Kérheti adatai végleges törlését ("elfeledtetéshez való jog").</li>
          <li><strong>Adathordozhatóság:</strong> Kérheti adatai kiadását géppel olvasható formátumban.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>7. Jogorvoslat</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '15px' }}>
          Amennyiben úgy érzi, személyes adatait nem megfelelően kezeltük, kérjük, forduljon hozzánk bizalommal a megadott e-mail címen. 
          Emellett panaszt tehet a hatóságnál:
        </p>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p style={{ color: '#fff', fontWeight: '700', marginBottom: '5px' }}>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</p>
          <p style={{ color: '#cbd5e1' }}>Cím: 1055 Budapest, Falk Miksa utca 9-11.</p>
          <p style={{ color: '#cbd5e1' }}>Web: <a href="http://www.naih.hu" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>www.naih.hu</a></p>
        </div>
      </section>

      <footer style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Kelt: 2024. május 22.</p>
      </footer>
    </div>
  );
}
