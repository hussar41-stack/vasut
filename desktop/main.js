const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "TransportHU Desktop",
    icon: path.join(__dirname, 'icon.png'), // Ha lesz ikonunk
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Betöltjük a buildelt frontend fájlokat
  win.loadFile(path.join(__dirname, 'frontend-build/index.html'));

  // Egyedi menü (opcionális)
  Menu.setApplicationMenu(null); 
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
