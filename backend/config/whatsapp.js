const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// WhatsApp configuration
const whatsappConfig = {
    clientId: process.env.WHATSAPP_CLIENT_ID || 'enielexpress-bot',
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '+2348012345678'
};

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({ clientId: whatsappConfig.clientId }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// QR code event
client.on('qr', (qr) => {
    console.log('QR Code received, please scan:');
    qrcode.generate(qr, { small: true });
});

// Ready event
client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Authentication failure event
client.on('auth_failure', msg => {
    console.error('Authentication failure:', msg);
});

// Disconnected event
client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
});

// Initialize WhatsApp client
client.initialize();

// Send message function
const sendMessage = async (phoneNumber, message) => {
    try {
        // Format phone number (remove + if present)
        const formattedNumber = phoneNumber.startsWith('+') 
            ? phoneNumber.substring(1) + '@c.us' 
            : phoneNumber + '@c.us';
        
        const response = await client.sendMessage(formattedNumber, message);
        return response;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
};

// Send tracking update
const sendTrackingUpdate = async (phoneNumber, trackingNumber, status, location, description) => {
    const message = `*P&D EnielExpress Tracking Update*\n\n` +
        `Tracking Number: ${trackingNumber}\n` +
        `Status: ${status}\n` +
        `Location: ${location}\n` +
        `Description: ${description}\n\n` +
        `Track your shipment: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracking.html?number=${trackingNumber}`;
    
    return await sendMessage(phoneNumber, message);
};

// Send payment confirmation
const sendPaymentConfirmation = async (phoneNumber, invoiceNumber, amount, paymentDate) => {
    const message = `*P&D EnielExpress Payment Confirmation*\n\n` +
        `Invoice Number: ${invoiceNumber}\n` +
        `Amount: ${amount}\n` +
        `Payment Date: ${paymentDate}\n\n` +
        `Thank you for your payment! Your invoice has been marked as paid.`;
    
    return await sendMessage(phoneNumber, message);
};

// Send delivery notification
const sendDeliveryNotification = async (phoneNumber, trackingNumber, recipientName, deliveryTime) => {
    const message = `*P&D EnielExpress Delivery Notification*\n\n` +
        `Dear ${recipientName},\n\n` +
        `Your package with tracking number ${trackingNumber} has been delivered.\n` +
        `Delivery Time: ${deliveryTime}\n\n` +
        `Thank you for choosing P&D EnielExpress!`;
    
    return await sendMessage(phoneNumber, message);
};

module.exports = {
    client,
    whatsappConfig,
    sendMessage,
    sendTrackingUpdate,
    sendPaymentConfirmation,
    sendDeliveryNotification
};