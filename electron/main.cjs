const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const APP_TITLE = 'PawBudget 毛球账本';

function createWindow() {
  const win = new BrowserWindow({
    title: APP_TITLE,
    width: 480,
    height: 860,
    minWidth: 390,
    minHeight: 680,
    backgroundColor: '#fffaf1',
    icon: path.join(__dirname, '..', 'build', 'icon-source.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    if (url !== current && /^https?:/i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    const win = windows[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.meowbuild.pawbudget');
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
