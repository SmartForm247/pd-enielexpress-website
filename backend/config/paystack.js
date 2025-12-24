const PaystackPop = require('@paystack/inline-js');

// Paystack configuration
const paystackConfig = {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_demo',
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_demo',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:5000/api/payments/callback'
};

// Initialize Paystack
const initializePayment = (email, amount, reference, callback) => {
    const paystack = new PaystackPop();
    paystack.newTransaction({
        key: paystackConfig.publicKey,
        email: email,
        amount: amount * 100, // Convert to kobo/cents
        ref: reference,
        callback: function(response) {
            callback(response);
        },
        onClose: function() {
            console.log('Payment window closed');
        }
    });
};

// Verify payment
const verifyPayment = async (reference) => {
    const https = require('https');
    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${paystackConfig.secretKey}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.status) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
};

// Create payment plan
const createPaymentPlan = async (name, amount, interval, description) => {
    const https = require('https');
    const postData = JSON.stringify({
        name: name,
        amount: amount * 100, // Convert to kobo/cents
        interval: interval,
        description: description
    });
    
    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/paymentplan',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${paystackConfig.secretKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.status) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
};

module.exports = {
    paystackConfig,
    initializePayment,
    verifyPayment,
    createPaymentPlan
};