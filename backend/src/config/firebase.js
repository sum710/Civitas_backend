const admin = require('firebase-admin');
require('dotenv').config();

// In a real scenario, we load the service account from a file or env var
// const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    try {
        let serviceAccount;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Handle stringified JSON from env var
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // Fallback to file path for local development
            const path = require('path');
            const fullPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
                ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
                : path.join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            serviceAccount = require(fullPath);
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin Initialized using service account');
        } else {
            // Fallback to default credentials if no config provided
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log('Firebase Admin Initialized using application default');
        }
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

module.exports = admin;
