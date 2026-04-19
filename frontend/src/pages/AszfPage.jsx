import React from 'react';

export default function AszfPage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '10px' }}>ÁLTALÁNOS SZERZŐDÉSI FELTÉTELEK (ÁSZF)</h1>
        <p style={{ color: '#3b82f6', fontWeight: '600' }}>TransportHU – Közösségi Közlekedési Szolgáltatás</p>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Hatályos: 2024. május 22-től</p>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>1. AZ ADATKEZELŐ (SZOLGÁLTATÓ) ADATAI</h2>
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong>Név:</strong> Huszár Barnabás (TransportHU fejlesztő)</p>
          <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong>Székhely/Elérhetőség:</strong> hbgmunka@gmail.com</p>
          <p style={{ color: '#cbd5e1', marginBottom: '8px' }}><strong>Telefonszám:</strong> +36 70 327 0059</p>
          <p style={{ color: '#cbd5e1' }}><strong>Weboldal:</strong> transporthu.hu</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>2. A SZOLGÁLTATÁS TÁRGYA</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          A TransportHU egy közösségi közlekedés tervező platform, amely útvonaltervezési, menetrendi és kényelmi funkciókat kínál a felhasználók számára. 
          A szolgáltatás tartalmaz ingyenesen elérhető alapfunkciókat és díjköteles prémium szolgáltatásokat (pl. hirdetésmentesség, mentett útvonalak bővített köre, speciális AI tervezés).
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>3. REGISZTRÁCIÓ ÉS FELHASZNÁLÓI FIÓK</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          A Szolgáltatás bizonyos elemei regisztrációhoz kötöttek. A Felhasználó köteles a regisztráció során valós adatokat megadni. 
          A Felhasználó felelős a saját jelszavának titokban tartásáért és a fiókjával végzett összes tevékenységért.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>4. PRÉMIUM SZOLGÁLTATÁSOK ÉS FIZETÉS</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '10px' }}>
          A prémium szolgáltatások igénybevétele díjköteles. A fizetés a Stripe biztonságos online fizetési rendszerén keresztül történik.
        </p>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>Fizetési módok:</strong> Bankkártyás fizetés (Visa, Mastercard, stb.).</li>
          <li><strong>Számlázás:</strong> A Szolgáltató a sikeres tranzakciót követően elektronikus számlát küld a Felhasználó által megadott e-mail címre.</li>
          <li><strong>Felelősség:</strong> A Szolgáltató nem tárol bankkártyaadatokat, a tranzakciók biztonságáért a Stripe felel.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>5. ELÁLLÁSI JOG ÉS VISSZATÉRÍTÉS</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          Tekintettel arra, hogy a szolgáltatás digitális tartalomnak minősül, a Felhasználó a szolgáltatás igénybevételének megkezdésével (a prémium funkció aktiválásával) tudomásul veszi, hogy elveszíti elállási jogát a 45/2014. (II. 26.) Korm. rendelet értelmében. 
          Visszatérítésre technikai hiba vagy nem teljesített szolgáltatás esetén van lehetőség, egyedi elbírálás alapján.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>6. FELELŐSSÉG KORLÁTOZÁSA</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          A Szolgáltató törekszik a menetrendi adatok pontosságára, de a külső adatszolgáltatók (pl. MÁV, BKK) hibáiból eredő téves információkért, késésekért felelősséget nem vállal. 
          A Szolgáltatás használata a Felhasználó saját felelősségére történik.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>7. SZERZŐI JOGOK</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          A Weboldal teljes tartalma, grafikai elemei és kódkészlete a Szolgáltató szellemi tulajdonát képezi. 
          Ezek bármilyen jellegű másolása vagy engedély nélküli felhasználása jogi következményeket von maga után.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>8. ZÁRÓ RENDELKEZÉSEK</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
          A Szolgáltató jogosult az ÁSZF egyoldalú módosítására. A módosítások a weboldalon való közzététellel lépnek hatályba. 
          A jelen szerződésben nem szabályozott kérdésekben a magyar jog (Ptk.) az irányadó.
        </p>
      </section>

      <footer style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Budapest, 2024. május 22.</p>
      </footer>
    </div>
  );
}
