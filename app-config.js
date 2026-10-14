(() => {
  'use strict';

  const config = {
    environment: 'production',
    productionUrl: 'https://quotes.starry.phd/',
    googleSheetCsvUrl: 'https://docs.google.com/spreadsheets/d/1HufZqMwvvZh735nBMvKnDDI-BnZMUuYmFTA0_3B2lCE/export?format=csv',
    qrCodeApiBaseUrl: 'https://api.qrserver.com/v1/create-qr-code/',
    shareFileName: 'BetterYou.png',
    shareText: '分享金句',
    starryIdBaseUrl: 'https://id.starry.phd',
    starryIdentityUrl: 'https://id.starry.phd/api/apps/quotes/identity',
    starryIdLoginUrl: 'https://id.starry.phd/auth/quotes',
    starryIdProfileUrl: 'https://id.starry.phd/'
  };

  window.StarryConfig = Object.freeze(config);
})();
