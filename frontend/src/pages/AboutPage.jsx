import React from 'react';

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '20px', 
    padding: '30px', 
    border: '1px solid rgba(255,255,255,0.05)',
    flex: '1 1 300px'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>{icon}</div>
    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>{title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>{desc}</p>
  </div>
);

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ color: '#fff', fontSize: '3rem', marginBottom: '20px', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rólunk - TransportHU</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
          Utazzon okosabban. A TransportHU küldetése a közösségi közlekedés modernizálása és egyszerűsítése.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '60px' }}>
        <section style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '20px' }}>A Küldetésünk</h2>
          <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
            A TransportHU célja, hogy egyszerűbbé, gyorsabbá és átláthatóbbá tegye a közösségi közlekedést Magyarországon. 
            Hiszünk abban, hogy a modern technológia segítségével a tömegközlekedés nem nyűg, hanem egy fenntartható és 
            kényelmes alternatíva lehet mindenki számára.
          </p>
        </section>

        <section style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
          <h2 style={{ color: '#a78bfa', fontSize: '1.5rem', marginBottom: '20px' }}>A Történetünk</h2>
          <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
            A projekt egy egyszerű felismerésből indult: szükség van egy olyan platformra, amely nemcsak útvonalat tervez, 
            hanem a felhasználói élményt helyezi a középpontba. A TransportHU-t úgy alakítottuk ki, hogy a lehető legkevesebb 
            kattintással a legpontosabb információhoz juttassa Önt.
          </p>
        </section>
      </div>

      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', textAlign: 'center', marginBottom: '40px' }}>Miért válassza a TransportHU-t?</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <FeatureCard 
            icon="🎨" 
            title="Felhasználóbarát felület" 
            desc="Letisztult design, amely asztali gépen és mobilon is tökéletesen működik." 
          />
          <FeatureCard 
            icon="⭐" 
            title="Személyre szabhatóság" 
            desc="Mentse el kedvenc útvonalait, és érje el őket egyetlen gombnyomással." 
          />
          <FeatureCard 
            icon="🛡️" 
            title="Biztonság" 
            desc="A legmagasabb szintű adatvédelmi irányelveket követjük, és a világvezető Stripe rendszerét használjuk." 
          />
          <FeatureCard 
            icon="📈" 
            title="Folyamatos fejlődés" 
            desc="Rendszeresen frissítjük algoritmusainkat a felhasználói visszajelzések alapján." 
          />
        </div>
      </section>

      <section style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '50px', borderRadius: '30px', marginBottom: '60px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '20px' }}>A Fejlesztőről</h2>
        <p style={{ color: '#cbd5e1', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto 30px' }}>
          A TransportHU mögött <strong>Huszár Barnabás</strong> áll, aki elkötelezett híve az okos városi megoldásoknak 
          és a hatékony szoftverfejlesztésnek. A projekt célja, hogy a magyarországi közlekedési adatokból 
          a legtöbbet hozza ki a közösség számára.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</p>
            <p style={{ color: '#fff', fontWeight: '600' }}>hbgmunka@gmail.com</p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Telefon</p>
            <p style={{ color: '#fff', fontWeight: '600' }}>+36 70 327 0059</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '15px' }}>Dokumentumok</h3>
          <button 
            onClick={() => {
              const content = `# TransportHU – Szoftver Értékbecslés\n\nBecsült fejlesztési érték: 2,2M Ft - 6,2M Ft\nPiaci szorzókkal korrigált érték: 8M Ft - 12M Ft\nKódbázis szintjén eladási ár: 3-5 millió Ft\nSzolgáltatásként eladási ár: 10-20 millió Ft\n\nKelt: 2024. 04. 19.`;
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'TransportHU_Ertekbecsles.txt';
              link.click();
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            📥 Értékbecslés letöltése (.txt)
          </button>
        </div>
      </section>

      <footer style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <p style={{ color: '#3b82f6', fontWeight: '700', fontSize: '1.2rem' }}>TransportHU - Utazzon okosabban.</p>
      </footer>
    </div>
  );
}
