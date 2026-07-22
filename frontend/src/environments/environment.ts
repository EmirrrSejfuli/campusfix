// Used for local development (ng serve / docker-compose build without --configuration production).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  uploadsBase: 'http://localhost:3000',
  recaptchaSiteKey: '', // set your reCAPTCHA v3 site key here to enable it locally
};
