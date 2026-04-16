const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Helper funkció a PDF Bufferré alakításához (hogy memóriából küldhessük el emailenként, fájlmentés nélkül)
const buildPdfBuffer = (doc) => {
  return new Promise((resolve) => {
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
};

const generateTicketPDF = async (ticket) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const bufferPromise = buildPdfBuffer(doc);

  // Fejléc (sötét háttér)
  doc.rect(0, 0, doc.page.width, 100).fill('#1e293b');
  
  // TransportHU Logo
  try {
    doc.image('./assets/logo_transporthu.png', 30, 20, { height: 60 });
  } catch (err) {
    doc.fillColor('#ffffff').fontSize(24).text('TransportHU', 50, 35);
  }

  // Network (BKK/MÁV) Logo
  try {
    if (ticket.network === 'bkk') {
      doc.image('./assets/logo_bkk.png', doc.page.width - 250, 25, { height: 50 });
    } else {
      doc.image('./assets/logo_mav.png', doc.page.width - 250, 25, { height: 50 });
    }
  } catch (err) {
    console.error('Logo draw error:', err);
  }

  // Title text
  const ticketTitle = ticket.network === 'bkk' ? 'BKK Vonaljegy / Single Ticket' : 'MÁV Elektronikus Jegy / E-Ticket';
  doc.fillColor('#94a3b8').fontSize(14).text(ticketTitle, 50, 110);

  // Generáljunk egy egyedi QR kódot az ellenőrnek (jegy kódja alapján)
  try {
    const qrData = `JEGY-${ticket.confirmationCode} NEV:${ticket.passengerName}`;
    const qrBuffer = await QRCode.toBuffer(qrData, { 
      type: 'png', 
      margin: 1, 
      width: 80,
      color: { dark: '#000000', light: '#ffffff' }
    });
    // Jobb felső sarokba rakjuk
    doc.image(qrBuffer, doc.page.width - 120, 12, { width: 76 });
  } catch (err) {
    console.error('QR kód generálási hiba:', err);
  }

  // QR kód helyett egy stilizált azonosító blokk
  doc.fillColor('#000000');
  doc.rect(50, 140, doc.page.width - 100, 80).stroke();
  doc.fontSize(20).text(`JEGYAZONOSÍTÓ: ${ticket.confirmationCode}`, 70, 165, { align: 'center' });

  // Utazási adatok
  doc.fontSize(16).text('Utazás Adatai', 50, 260, { underline: true });
  doc.fontSize(12).moveDown();
  doc.text(`Utas neve: ${ticket.passengerName}`);
  doc.moveDown(0.5);
  doc.text(`Viszonylat: ${ticket.from} - ${ticket.to}`);
  doc.moveDown(0.5);
  doc.text(`Indulás ideje: ${new Date(ticket.departureTime).toLocaleString('hu-HU')}`);
  doc.moveDown(0.5);
  // BKK esetében nincs "Kocsiosztály"
  if (ticket.network !== 'bkk') {
    doc.text(`Kocsiosztály: ${ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}`);
    doc.moveDown(0.5);
  }
  doc.text(`Személyek száma: ${ticket.quantity} fő`);
  doc.moveDown(0.5);
  doc.text(`Típus: ${ticket.network === 'bkk' ? 'BKK Vonaljegy' : 'MÁV ' + ticket.tripName}`);

  // Lábléc
  doc.fontSize(10).fillColor('gray');
  doc.text('Kérjük, mutassa be ezt a dokumentumot az ellenőrnek nyomtatva vagy mobileszközön.', 50, 700, { align: 'center' });
  doc.text(`Generálva: ${new Date().toLocaleString('hu-HU')}`, { align: 'center' });

  doc.end();
  return bufferPromise;
};

const generateInvoicePDF = async (ticket) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const bufferPromise = buildPdfBuffer(doc);

  // Fejléc
  doc.fontSize(24).text('Számla / Bizonylat', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Számlaszám: INV-${ticket.confirmationCode}`);
  doc.text(`Dátum: ${new Date().toLocaleString('hu-HU')}`);
  doc.moveDown();

  // Szolgáltató
  doc.text('Szolgáltató:');
  doc.text('TransportHU Zrt.');
  doc.text('8000 Székesfehérvár, Érsekujvári utca 17/A');
  doc.text('Adószám: 12345678-2-41');
  doc.moveDown();

  // Vevő
  doc.text('Vevő:');
  doc.text(`${ticket.passengerName}`);
  doc.text(`${ticket.passengerEmail}`);
  doc.moveDown(2);

  // Tétel
  const tableTop = 300;
  doc.font('Helvetica-Bold');
  doc.text('Tétel megnevezése', 50, tableTop);
  doc.text('Mennyiség', 300, tableTop);
  doc.text('Bruttó ár', 450, tableTop);
  
  doc.rect(50, tableTop + 15, doc.page.width - 100, 1).stroke();
  doc.font('Helvetica');
  doc.text(`Menetjegy (${ticket.from} - ${ticket.to})`, 50, tableTop + 25);
  doc.text(`${ticket.quantity} db`, 300, tableTop + 25);
  doc.text(`${ticket.totalPrice} Ft`, 450, tableTop + 25);

  doc.rect(50, tableTop + 45, doc.page.width - 100, 1).stroke();

  doc.font('Helvetica-Bold');
  doc.text('Összesen fizetendő:', 300, tableTop + 60);
  doc.text(`${ticket.totalPrice} Ft`, 450, tableTop + 60);

  doc.end();
  return bufferPromise;
};

module.exports = {
  generateTicketPDF,
  generateInvoicePDF
};
