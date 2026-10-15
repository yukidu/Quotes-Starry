(() => {
  'use strict';

  const config = {
    environment: 'production',
    productionUrl: 'https://quotes.starry.phd/',
    starryIdOrigin: 'https://id.starry.phd',
    googleSheetCsvUrl: 'https://docs.google.com/spreadsheets/d/1HufZqMwvvZh735nBMvKnDDI-BnZMUuYmFTA0_3B2lCE/export?format=csv',
    qrCodeApiBaseUrl: 'https://api.qrserver.com/v1/create-qr-code/',
    html2CanvasUrl: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    shareFileName: 'BetterYou.png',
    shareTitle: '繁星語錄 Quotes Starry',
    shareText: '分享金句'
  };

  window.StarryConfig = Object.freeze(config);
})();
