import React from 'react';
import { version } from '../version';

export default function CertificatePage() {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ 
        background: '#fff', 
        color: '#1a202c', 
        padding: '60px', 
        borderRadius: '8px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        fontFamily: "'Times New Roman', Times, serif",
        lineHeight: '1.5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '8rem',
          color: 'rgba(0,0,0,0.03)',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          TRANSPORT HU
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '0.9rem', borderBottom: '2px solid #1a202c', paddingBottom: '10px' }}>
            <div>
              <strong>Iktatószám:</strong> THU/2024/DEMO-V7-9921-FULL<br />
              <strong>Példányszám:</strong> 01/Eredeti
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Kibocsátás dátuma:</strong> {new Date().toLocaleDateString('hu-HU')}
            </div>
          </div>

          <h1 style={{ textAlign: 'center', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>
            Tanúsítvány és Tesztelési Keretszabályzat
          </h1>
          <h2 style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '40px', fontWeight: 'normal', fontStyle: 'italic' }}>
            A TransportHU Szoftverinterfész Demo Verziójának Hivatalos Vizsgálatához
          </h2>

          <div style={{ marginBottom: '30px' }}>
            <p><strong>Kibocsátó:</strong> Huszár Barnabás (egyéni fejlesztő / TransportHU projektvezető)</p>
            <p><strong>Tárgy:</strong> Demo verzió használati jogosultsága, technikai állapotrögzítése és jogi keretrendszere.</p>
          </div>

          <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '30px' }}>I. PREAMBULUM</h3>
          <p style={{ textAlign: 'justify' }}>
            Jelen dokumentum (a továbbiakban: Tanúsítvány) célja a TransportHU elnevezésű, közösségi közlekedést
            támogató szoftverrendszer kísérleti (Demo) fázisának szabályozása. A TransportHU projekt egy olyan
            integrált megoldást kínál, amely a mesterséges intelligencia (AI) segítségével optimalizálja a
            személyszállítási útvonalakat, valamint közvetlen interfészt biztosít a jegy- és bérletértékesítési
            folyamatokhoz.
          </p>
          <p style={{ textAlign: 'justify' }}>
            A dokumentum aláírásával az Átvevő (Tesztelő) tudomásul veszi, hogy a szoftver fejlesztés alatt álló
            termék, melynek egyes funkciói korlátozottak vagy hibás működést mutathatnak.
          </p>

          <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '30px' }}>II. TECHNIKAI ÁLLAPOTRÖGZÍTÉS ÉS ISMERT ANOMÁLIÁK</h3>
          <p>
            A fejlesztői csapat (a továbbiakban: Fejlesztő) rögzíti, hogy a demo verzió <strong>{version}-ös változata</strong> funkcionálisan
            stabil, azonban az alábbi modulok tesztelése során fokozott körültekintés szükséges:
          </p>

          <h4 style={{ fontSize: '1.1rem', marginTop: '20px', marginBottom: '10px' }}>2.1. Fizetési modul és Stripe integráció</h4>
          <p style={{ textAlign: 'justify' }}>
            A rendszer jelenleg a Stripe Payments Europe, Ltd. tesztkörnyezetét (Sandbox) használja. 
            <strong> A v{version} verzióban a korábbi ár-inkonzisztencia javításra került.</strong> A dinamikus árazási 
            algoritmus és a kedvezménykezelési logika szinkronizálva lett, így a frontend és a Stripe felé továbbított 
            összegek egyezősége biztosított.
          </p>

          <h4 style={{ fontSize: '1.1rem', marginTop: '20px', marginBottom: '10px' }}>2.2. Térképi és menetrendi adatok integrációja</h4>
          <p style={{ textAlign: 'justify' }}>
            A szoftver architektúrája felkészült a GTFS és GTFS-Realtime adatok fogadására. Jelen fázisban a valós
            idejű adatszolgáltatás a MÁV-START Zrt. hivatalos API hozzáférésére vár. Ezen hozzáférés hiányában a
            térképi modul statikus adatokkal és szimulált pozíciókkal operál.
          </p>

          <h4 style={{ fontSize: '1.1rem', marginTop: '20px', marginBottom: '10px' }}>2.3. Mesterséges Intelligencia (AI) Utazástervező</h4>
          <p style={{ textAlign: 'justify' }}>
            Az "AI Travel Advisor" modul nagynyelvű modelleket (LLM) használ a természetes nyelven érkező
            lekérdezések feldolgozására. A tesztelés során "Internal AI Error" típusú üzenetek fordulhatnak elő
            limitációk esetén.
          </p>

          <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '30px' }}>III. TESZTELÉSI HOZZÁFÉRÉS ÉS BIZTONSÁG</h3>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '5px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>● <strong>Tesztkártya tulajdonosa:</strong> TransportHU Zrt.</li>
              <li>● <strong>Kártyaszám:</strong> 4242 4242 4242 4242</li>
              <li>● <strong>Validitás:</strong> 03/31</li>
              <li>● <strong>CVC:</strong> 333</li>
            </ul>
          </div>

          <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '30px' }}>IV. JOGI NYILATKOZATOK ÉS SZELLEMI TULAJDON</h3>
          <p style={{ fontSize: '0.9rem', textAlign: 'justify' }}>
            <strong>4.1. Szerzői jogok:</strong> A TransportHU szoftver teljes forráskódja Huszár Barnabás kizárólagos szellemi tulajdonát képezi.<br />
            <strong>4.2. Védjegyhasználat:</strong> A MÁV és BKK védjegyek kizárólag integrációs tesztelési célt szolgálnak.<br />
            <strong>4.3. Titoktartás (NDA):</strong> A Tesztelő vállalja a technikai megoldások bizalmas kezelését.
          </p>

          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #1a202c', marginBottom: '10px', height: '40px' }}></div>
              <p style={{ fontSize: '0.8rem' }}><strong>Huszár Barnabás</strong><br />Kibocsátó (Fejlesztő)</p>
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #1a202c', marginBottom: '10px', height: '40px' }}></div>
              <p style={{ fontSize: '0.8rem' }}><strong>Átvevő</strong><br />(MÁV/BKK képviselője)</p>
            </div>
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>TRANSPORT HU</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Hivatalos Igazolás</div>
            <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '5px' }}>v{version} STABIL DEMO</div>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '10px 30px' }}>
          🖨️ Nyomtatás / Mentés PDF-ként
        </button>
      </div>
    </div>
  );
}
