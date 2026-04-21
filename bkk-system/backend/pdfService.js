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

  // Szaggatott vonal (perforáció illúzió)
  doc.moveTo(50, 130).lineTo(doc.page.width - 50, 130).dash(5, { space: 10 }).strokeColor('#cbd5e1').stroke();
  doc.undash();

  // QR kód helyett egy stilizált azonosító blokk (Jegyazonosító)
  doc.rect(50, 150, doc.page.width - 100, 80).fillAndStroke('#f8fafc', '#e2e8f0');
  
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text('JEGYAZONOSÍTÓ / TICKET ID', 50, 170, { align: 'center', characterSpacing: 1 });
  doc.fillColor('#2563eb').fontSize(22).text(`${ticket.confirmationCode}`, 50, 190, { align: 'center', characterSpacing: 3 });

  // Utazási adatok (Szürke blokk)
  doc.rect(50, 250, doc.page.width - 100, 240).fill('#f1f5f9');
  
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('UTAZÁS ADATAI / JOURNEY DETAILS', 70, 270);
  
  // Térhálós elrendezés az adatoknak
  let row = 310;
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('UTAS NEVE / PASSENGER', 70, row);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${ticket.passengerName}`, 70, row + 15);

  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('MENNYISÉG / PAX', 350, row);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${ticket.quantity} fő`, 350, row + 15);

  row += 55;
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('VISZONYLAT / ROUTE', 70, row);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${ticket.from}   —   ${ticket.to}`, 70, row + 15);

  row += 55;
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('INDULÁS / DEPARTURE', 70, row);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${new Date(ticket.departureTime).toLocaleString('hu-HU')}`, 70, row + 15);

  row += 55;
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('TÍPUS / TYPE', 70, row);
  const classText = ticket.network === 'bkk' ? '' : ` | ${ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}`;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${ticket.network === 'bkk' ? 'BKK Vonaljegy' : 'MÁV ' + ticket.tripName}${classText}`, 70, row + 15);

  // Lábléc
  doc.font('Helvetica').fontSize(10).fillColor('gray');
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
