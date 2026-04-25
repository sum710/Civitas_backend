const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authMiddleware = require('./middlewares/authMiddleware');
const langMiddleware = require('./middlewares/langMiddleware');
const authController = require('./controllers/authController');
const committeeController = require('./controllers/committeeController');
const ledgerController = require('./controllers/ledgerController');
const trustEngine = require('./engines/trustScoreEngine');
const payoutService = require('./services/payoutService');
const paymentController = require('./controllers/paymentController');
const userController = require('./controllers/userController');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(langMiddleware);

// Routes

// ID Check / Home
app.get('/', (req, res) => {
    res.send('Civitas FinTech API v1.0');
});

// Auth Routes
app.post('/api/auth/login', authController.loginUser);
app.post('/api/auth/signup', authController.registerUser);

// User Routes
app.get('/api/users/wallet-balance', authMiddleware, userController.getWalletBalance);
app.post('/api/users/deposit', authMiddleware, userController.depositFunds);

// Committee Routes
app.post('/api/committees', authMiddleware, committeeController.createCommittee);
app.get('/api/committees', committeeController.getAllCommittees);
app.get('/api/committees/my', authMiddleware, committeeController.getUserCommittees);
app.get('/api/committees/:id', authMiddleware, committeeController.getCommitteeDetails);
app.post('/api/committees/:id/join', authMiddleware, committeeController.joinCommittee);
app.post('/api/committees/:id/draw', authMiddleware, committeeController.drawNextWinner);
app.post('/api/committees/join-with-code', authMiddleware, committeeController.joinWithCode);

// Ledger Routes
app.post('/api/ledger/contribute', authMiddleware, ledgerController.contribute);

// Payment Routes
app.post('/api/payments/contribute', authMiddleware, paymentController.makeContribution);
app.post('/api/payments/payout', authMiddleware, paymentController.requestPayout);

// Trust Score
app.get('/api/trust/score', authMiddleware, trustEngine.getTrustScore);

// Payout (Admin or System trigger usually, protected for now)
app.post('/api/payout/execute', authMiddleware, payoutService.executePayout);

// AI Financial Advisor Route
app.use('/api/ai', aiRoutes);

// Ledger / Ledger Payment Routes
const paymentLedgerController = require('./controllers/paymentLedgerController');
app.get('/api/ledger/:committee_id', authMiddleware, paymentLedgerController.getLedger);
app.post('/api/ledger/process', authMiddleware, paymentLedgerController.processPayment);
app.post('/api/ledger/reminders', authMiddleware, paymentLedgerController.sendReminders);

// Activity Logs Route
const activityController = require('./controllers/activityController');
app.get('/api/logs/:committeeId', authMiddleware, activityController.getCommitteeLogs);


module.exports = app;
