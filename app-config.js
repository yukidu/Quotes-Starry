(() => {
  'use strict';

  const config = {
    appId: 'starry-mirror',
    appName: '繁星心鏡',
    appNameEn: 'Starry Mirror',
    environment: 'production',
    productionUrl: 'https://quotes.starry.phd/',
    starryIdOrigin: 'https://id.starry.phd',
    starryIdLoginPath: '/auth/quotes',
    mirrorApiBase: '/api/mirror',
    googleSheetCsvUrl: 'https://docs.google.com/spreadsheets/d/1HufZqMwvvZh735nBMvKnDDI-BnZMUuYmFTA0_3B2lCE/export?format=csv',
    qrCodeApiBaseUrl: 'https://api.qrserver.com/v1/create-qr-code/',
    html2CanvasUrl: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    shareFileName: 'Starry-Mirror.png',
    shareTitle: '繁星心鏡 Starry Mirror',
    shareText: '分享我的繁星心鏡金句'
  };

  window.StarryConfig = Object.freeze(config);
})();
