const PDFDocument = require('pdfkit');

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

  // Fejléc
  doc.rect(0, 0, doc.page.width, 100).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(24).text('TransportHU', 50, 35);
  doc.fontSize(12).text('Elektronikus Jegy / E-Ticket', 50, 65);

  // QR kód helyett egy stilizált azonosító blokk
  doc.fillColor('#000000');
  doc.rect(50, 130, doc.page.width - 100, 80).stroke();
  doc.fontSize(20).text(`JEGYAZONOSÍTÓ: ${ticket.confirmationCode}`, 70, 155, { align: 'center' });

  // Utazási adatok
  doc.fontSize(16).text('Utazás Adatai', 50, 250, { underline: true });
  doc.fontSize(12).moveDown();
  doc.text(`Utas neve: ${ticket.passengerName}`);
  doc.moveDown(0.5);
  doc.text(`Viszonylat: ${ticket.from} - ${ticket.to}`);
  doc.moveDown(0.5);
  doc.text(`Indulás ideje: ${new Date(ticket.departureTime).toLocaleString('hu-HU')}`);
  doc.moveDown(0.5);
  doc.text(`Kocsiosztály: ${ticket.seatClass === 'FIRST' ? '1. osztály' : '2. osztály'}`);
  doc.moveDown(0.5);
  doc.text(`Személyek száma: ${ticket.quantity} fő`);

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
