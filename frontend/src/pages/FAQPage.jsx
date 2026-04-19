import React from 'react';

const FAQItem = ({ question, answer }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '16px', 
    padding: '24px', 
    marginBottom: '16px', 
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'transform 0.2s ease',
    cursor: 'default'
  }}>
    <h3 style={{ color: '#3b82f6', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '1.2rem' }}>❓</span> {question}
    </h3>
    <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>{answer}</p>
  </div>
);

export default function FAQPage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '16px' }}>Gyakran Ismételt Kérdések (GY.I.K.)</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Üdvözöljük a TransportHU segédletében! Itt összegyűjtöttük a leggyakoribb kérdéseket.</p>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>1. Általános kérdések</h2>
        <FAQItem 
          question="Mi az a TransportHU?" 
          answer="A TransportHU egy modern közösségi közlekedés tervező alkalmazás, amely segít megtalálni a leggyorsabb és legkényelmesebb útvonalakat Magyarország területén."
        />
        <FAQItem 
          question="Regisztráció nélkül is használhatom az oldalt?" 
          answer="Igen, az alapvető útvonaltervezési funkciók regisztráció nélkül is elérhetőek. Azonban a kedvenc útvonalak mentéséhez és a prémium funkciókhoz fiók létrehozása szükséges."
        />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>2. Útvonaltervezés és Kedvencek</h2>
        <FAQItem 
          question="Hogyan menthetek el egy útvonalat a kedvencek közé?" 
          answer="A tervezés után az útvonal mellett található 'csillag' vagy 'mentés' ikonra kattintva adhatja hozzá azt a saját profiljához. Ezeket később bármikor elérheti a 'Kedvenceim' menüpont alatt."
        />
        <FAQItem 
          question="Miért nem látja az oldal az aktuális helyzetemet?" 
          answer="Kérjük, ellenőrizze a böngésző beállításaiban, hogy engedélyezte-e a helymeghatározást a TransportHU számára. Ha elutasította az engedélykérést, a böngésző címsorában a lakat ikonra kattintva módosíthatja azt."
        />
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>3. Fizetés és Előfizetés</h2>
        <FAQItem 
          question="Milyen fizetési módok érhetőek el?" 
          answer="A fizetés bankkártyával történik a világ egyik legbiztonságosabb fizetési rendszere, a Stripe segítségével. Elfogadunk minden nagyobb típusú kártyát (Visa, Mastercard, Maestro)."
        />
        <FAQItem 
          question="Biztonságban vannak a kártyaadataim?" 
          answer="Igen. A TransportHU nem látja és nem tárolja az Ön bankkártyaadatait. A teljes tranzakció a Stripe titkosított rendszerén keresztül zajlik."
        />
      </section>

      <div style={{ 
        textAlign: 'center', 
        padding: '30px', 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        borderRadius: '20px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <p style={{ color: '#fff', marginBottom: '10px' }}>Nem találta a választ?</p>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Keressen minket bizalommal a <strong>hbgmunka@gmail.com</strong> címen!</p>
      </div>
    </div>
  );
}
