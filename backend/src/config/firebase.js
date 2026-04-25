const admin = require('firebase-admin');
require('dotenv').config();

// In a real scenario, we load the service account from a file or env var
// const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS env var
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

module.exports = admin;
