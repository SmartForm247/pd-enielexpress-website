// QR/Barcode scanning functionality for P&D EnielExpress

document.addEventListener('DOMContentLoaded', function() {
    // QR scanner elements
    const scanQRBtn = document.getElementById('scanQRBtn');
    const qrScannerModal = document.getElementById('qrScannerModal');
    const qrReaderElement = document.getElementById('qr-reader');
    let html5QrCode = null;
    
    // Initialize QR scanner button
    if (scanQRBtn) {
        scanQRBtn.addEventListener('click', function() {
            // Show QR scanner modal
            const modal = new bootstrap.Modal(qrScannerModal);
            modal.show();
            
            // Initialize QR scanner after modal is shown
            qrScannerModal.addEventListener('shown.bs.modal', function() {
                startQRScanner();
            }, { once: true });
        });
    }
    
    // Stop QR scanner when modal is hidden
    if (qrScannerModal) {
        qrScannerModal.addEventListener('hidden.bs.modal', function() {
            stopQRScanner();
        });
    }
    
    // Function to start QR scanner
    function startQRScanner() {
        // Check if qrReaderElement exists
        if (!qrReaderElement) return;
        
        // Clear previous scanner
        qrReaderElement.innerHTML = '';
        
        // Create new QR scanner instance
        html5QrCode = new Html5Qrcode("qr-reader");
        
        // Scanner configuration
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };
        
        // Start scanning
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                // QR code scanned successfully
                handleScannedQRCode(decodedText);
                
                // Stop scanner
                stopQRScanner();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(qrScannerModal);
                modal.hide();
            },
            (errorMessage) => {
                // Handle scan error silently
                console.log(errorMessage);
            }
        ).catch((err) => {
            // Handle scanner initialization error
            console.error(`Unable to start scanning: ${err}`);
            
            // Show error message
            qrReaderElement.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Unable to access camera. Please check your camera permissions.
                </div>
                <div class="text-center mt-3">
                    <button type="button" class="btn btn-primary" id="retryScanBtn">
                        <i class="bi bi-arrow-clockwise me-2"></i> Retry
                    </button>
                </div>
            `;
            
            // Add retry button event
            const retryBtn = document.getElementById('retryScanBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    startQRScanner();
                });
            }
        });
    }
    
    // Function to stop QR scanner
    function stopQRScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log("QR Scanner stopped successfully");
            }).catch((err) => {
                console.error(`Failed to stop QR Scanner: ${err}`);
            });
        }
    }
    
    // Function to handle scanned QR code
    function handleScannedQRCode(decodedText) {
        try {
            // Try to parse the QR code data
            let trackingNumber;
            
            // Check if it's a JSON object
            if (decodedText.startsWith('{')) {
                const data = JSON.parse(decodedText);
                trackingNumber = data.trackingNumber || data.tracking_id || data.id;
            } 
            // Check if it's a URL with tracking number
            else if (decodedText.includes('tracking') || decodedText.includes('track')) {
                const url = new URL(decodedText);
                trackingNumber = url.searchParams.get('number') || 
                                url.searchParams.get('id') || 
                                url.searchParams.get('tracking');
            }
            // Assume it's a plain tracking number
            else {
                trackingNumber = decodedText;
            }
            
            // Check if we're on the tracking page
            if (window.location.pathname.includes('tracking.html')) {
                // Fill in the tracking number and track
                const trackingInput = document.getElementById('trackingInput');
                const trackBtn = document.getElementById('trackBtn');
                
                if (trackingInput && trackBtn) {
                    trackingInput.value = trackingNumber;
                    trackBtn.click();
                }
            } else {
                // Redirect to tracking page with the tracking number
                window.location.href = `tracking.html?number=${encodeURIComponent(trackingNumber)}`;
            }
        } catch (error) {
            // Show error message
            PDEnilexpress.showAlert('Invalid QR code format', 'danger');
        }
    }
    
    // File upload for QR code scanning
    const qrFileInput = document.getElementById('qrFileInput');
    const qrFileBtn = document.getElementById('qrFileBtn');
    
    if (qrFileBtn && qrFileInput) {
        qrFileBtn.addEventListener('click', function() {
            qrFileInput.click();
        });
        
        qrFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                scanQRCodeFromFile(file);
            }
        });
    }
    
    // Function to scan QR code from file
    function scanQRCodeFromFile(file) {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }
        
        // Show loading state
        if (qrReaderElement) {
            qrReaderElement.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Scanning QR code from file...</p>
                </div>
            `;
        }
        
        // Scan the file
        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                // QR code scanned successfully
                handleScannedQRCode(decodedText);
                
                // Close modal if open
                if (qrScannerModal) {
                    const modal = bootstrap.Modal.getInstance(qrScannerModal);
                    if (modal) modal.hide();
                }
            })
            .catch(err => {
                // Handle scan error
                console.error(`Unable to scan QR code: ${err}`);
                
                // Show error message
                if (qrReaderElement) {
                    qrReaderElement.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Unable to scan QR code. Please try again with a clearer image.
                        </div>
                        <div class="text-center mt-3">
                            <button type="button" class="btn btn-primary" id="retryFileScanBtn">
                                <i class="bi bi-arrow-clockwise me-2"></i> Retry
                            </button>
                        </div>
                    `;
                    
                    // Add retry button event
                    const retryBtn = document.getElementById('retryFileScanBtn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', function() {
                            qrFileInput.click();
                        });
                    }
                }
            });
    }
    
    // Barcode scanner (if needed)
    const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
    const barcodeScannerModal = document.getElementById('barcodeScannerModal');
    
    if (scanBarcodeBtn && barcodeScannerModal) {
        scanBarcodeBtn.addEventListener('click', function() {
            // Show barcode scanner modal
            const modal = new bootstrap.Modal(barcodeScannerModal);
            modal.show();
            
            // Initialize barcode scanner after modal is shown
            barcodeScannerModal.addEventListener('shown.bs.modal', function() {
                startBarcodeScanner();
            }, { once: true });
        });
        
        // Stop barcode scanner when modal is hidden
        barcodeScannerModal.addEventListener('hidden.bs.modal', function() {
            stopBarcodeScanner();
        });
    }
    
    // Function to start barcode scanner
    function startBarcodeScanner() {
        // Implementation would be similar to QR scanner but with barcode-specific settings
        // For now, we'll just show a placeholder
        const barcodeReaderElement = document.getElementById('barcode-reader');
        if (barcodeReaderElement) {
            barcodeReaderElement.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-upc-scan display-1 text-primary"></i>
                    <p class="mt-3">Barcode scanner coming soon!</p>
                    <p>For now, please use the QR code scanner or enter the tracking number manually.</p>
                </div>
            `;
        }
    }
    
    // Function to stop barcode scanner
    function stopBarcodeScanner() {
        // Implementation would stop the barcode scanner
        console.log("Barcode scanner stopped");
    }
    
    // Export functions for use in other files
    window.PDEnilexpressScan = {
        startQRScanner,
        stopQRScanner,
        handleScannedQRCode,
        scanQRCodeFromFile
    };
});