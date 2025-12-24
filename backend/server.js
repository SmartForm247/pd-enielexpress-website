const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const trackingRoutes = require('./routes/tracking.routes');
const paymentRoutes = require('./routes/payment.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const scanRoutes = require('./routes/scan.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');

// Import middleware
const authMiddleware = require('./middleware/auth.middleware');
const errorMiddleware = require('./middleware/error.middleware');

// Import database connection
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // HTTP request logger
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Admin dashboard routes (protected)
app.use('/admin', authMiddleware.requireAuth, authMiddleware.requireAdmin, express.static(path.join(__dirname, '../admin')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'P&D EnielExpress API is running',
        timestamp: new Date().toISOString()
    });
});

// API documentation
app.get('/api', (req, res) => {
    res.json({
        message: 'P&D EnielExpress API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tracking: '/api/tracking',
            payments: '/api/payments',
            invoices: '/api/invoices',
            scan: '/api/scan',
            whatsapp: '/api/whatsapp'
        }
    });
});

// Handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});



// Add this to your server.js file
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
); 


module.exports = app;


