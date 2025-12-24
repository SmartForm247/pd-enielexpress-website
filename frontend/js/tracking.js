// Tracking functionality for P&D EnielExpress

document.addEventListener('DOMContentLoaded', function() {
    // Get tracking form elements
    const trackBtn = document.getElementById('trackBtn');
    const trackingInput = document.getElementById('trackingInput');
    const trackingResults = document.getElementById('trackingResults');
    const notifyBtn = document.getElementById('notifyBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    // Check if we have a tracking number in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const trackingNumber = urlParams.get('number');
    
    if (trackingNumber) {
        trackingInput.value = trackingNumber;
        trackShipment(trackingNumber);
    }
    
    // Track button click event
    if (trackBtn) {
        trackBtn.addEventListener('click', function() {
            const number = trackingInput.value.trim();
            if (number) {
                trackShipment(number);
            } else {
                trackingInput.classList.add('is-invalid');
                setTimeout(() => {
                    trackingInput.classList.remove('is-invalid');
                }, 3000);
            }
        });
    }
    
    // Enter key press in tracking input
    if (trackingInput) {
        trackingInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackBtn.click();
            }
        });
    }
    
    // Notify button click event
    if (notifyBtn) {
        notifyBtn.addEventListener('click', function() {
            const number = document.getElementById('trackingNumber').textContent;
            subscribeToNotifications(number);
        });
    }
    
    // Share button click event
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const number = document.getElementById('trackingNumber').textContent;
            shareTracking(number);
        });
    }
    
    // Function to track shipment
    function trackShipment(trackingNumber) {
        // Show loading state
        const originalBtnText = PDEnilexpress.showLoading(trackBtn, 'Tracking...');
        
        // Make API call to track shipment
        fetch(`/api/tracking/${trackingNumber}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Shipment not found');
                }
                return response.json();
            })
            .then(data => {
                // Update tracking results
                updateTrackingResults(data);
                
                // Show results
                trackingResults.style.display = 'block';
                
                // Scroll to results
                trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            })
            .catch(error => {
                // Show error message
                PDEnilexpress.showAlert(error.message, 'danger');
                
                // Hide results if shown
                trackingResults.style.display = 'none';
            })
            .finally(() => {
                // Reset button
                PDEnilexpress.hideLoading(trackBtn, originalBtnText);
            });
    }
    
    // Function to update tracking results
    function updateTrackingResults(data) {
        // Update basic information
        document.getElementById('trackingNumber').textContent = data.trackingNumber;
        document.getElementById('shipmentStatus').textContent = data.status;
        document.getElementById('estimatedDelivery').textContent = PDEnilexpress.formatDate(data.estimatedDelivery);
        document.getElementById('origin').textContent = data.origin;
        document.getElementById('destination').textContent = data.destination;
        document.getElementById('serviceType').textContent = data.serviceType;
        
        // Update status badge color
        const statusBadge = document.getElementById('shipmentStatus');
        statusBadge.className = 'badge';
        
        switch(data.status) {
            case 'Delivered':
                statusBadge.classList.add('bg-success');
                break;
            case 'Out for Delivery':
                statusBadge.classList.add('bg-info');
                break;
            case 'In Transit':
                statusBadge.classList.add('bg-primary');
                break;
            case 'Customs':
                statusBadge.classList.add('bg-warning');
                break;
            case 'Exception':
                statusBadge.classList.add('bg-danger');
                break;
            default:
                statusBadge.classList.add('bg-secondary');
        }
        
        // Update tracking history
        const timeline = document.querySelector('.timeline');
        timeline.innerHTML = '';
        
        data.trackingHistory.forEach(item => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            let markerClass = 'bg-secondary';
            if (item.status === 'Delivered') markerClass = 'bg-success';
            else if (item.status === 'Out for Delivery') markerClass = 'bg-info';
            else if (item.status === 'In Transit') markerClass = 'bg-primary';
            else if (item.status === 'Customs') markerClass = 'bg-warning';
            else if (item.status === 'Exception') markerClass = 'bg-danger';
            
            const formattedDate = PDEnilexpress.formatDate(item.date, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            timelineItem.innerHTML = `
                <div class="timeline-marker ${markerClass}"></div>
                <div class="timeline-content">
                    <h6 class="mb-1">${item.status}</h6>
                    <p class="text-muted mb-1">${item.location}</p>
                    <small class="text-muted">${formattedDate}</small>
                    ${item.description ? `<p class="mt-2">${item.description}</p>` : ''}
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        });
    }
    
    // Function to subscribe to notifications
    function subscribeToNotifications(trackingNumber) {
        // Show loading state
        const originalBtnText = PDEnilexpress.showLoading(notifyBtn, 'Subscribing...');
        
        // Make API call to subscribe
        fetch('/api/tracking/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trackingNumber: trackingNumber,
                phoneNumber: prompt('Enter your phone number for WhatsApp notifications:')
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to subscribe to notifications');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            PDEnilexpress.showAlert('You will now receive WhatsApp updates for this shipment', 'success');
        })
        .catch(error => {
            // Show error message
            PDEnilexpress.showAlert(error.message, 'danger');
        })
        .finally(() => {
            // Reset button
            PDEnilexpress.hideLoading(notifyBtn, originalBtnText);
        });
    }
    
    // Function to share tracking
    function shareTracking(trackingNumber) {
        const shareUrl = `${window.location.origin}/tracking.html?number=${trackingNumber}`;
        
        // Check if Web Share API is supported
        if (navigator.share) {
            navigator.share({
                title: 'Track your shipment with P&D EnielExpress',
                text: `Track your shipment ${trackingNumber} with P&D EnielExpress`,
                url: shareUrl
            })
            .catch(error => {
                console.log('Error sharing:', error);
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    PDEnilexpress.showAlert('Tracking link copied to clipboard', 'success');
                })
                .catch(error => {
                    console.error('Could not copy text: ', error);
                    PDEnilexpress.showAlert('Failed to copy tracking link', 'danger');
                });
        }
    }
    
    // Simulate tracking data for demo purposes
    function getMockTrackingData(trackingNumber) {
        return {
            trackingNumber: trackingNumber,
            status: 'In Transit',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            origin: 'New York, USA',
            destination: 'London, UK',
            serviceType: 'International Express',
            trackingHistory: [
                {
                    status: 'Package Received',
                    location: 'New York, USA',
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    description: 'Package has been received at the origin facility'
                },
                {
                    status: 'Departed Facility',
                    location: 'New York, USA',
                    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
                    description: 'Package has left the origin facility'
                },
                {
                    status: 'In Transit',
                    location: 'International Hub',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    description: 'Package is in transit to destination country'
                },
                {
                    status: 'Arrived at Destination Facility',
                    location: 'London, UK',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    description: 'Package has arrived at the destination facility'
                },
                {
                    status: 'Out for Delivery',
                    location: 'London, UK',
                    date: new Date(), // Today
                    description: 'Package is out for delivery'
                }
            ]
        };
    }
    
    // For demo purposes, use mock data if API is not available
    if (typeof trackShipment === 'function') {
        const originalTrackShipment = trackShipment;
        trackShipment = function(trackingNumber) {
            // Show loading state
            const originalBtnText = PDEnilexpress.showLoading(trackBtn, 'Tracking...');
            
            // Simulate API delay
            setTimeout(() => {
                // Get mock data
                const data = getMockTrackingData(trackingNumber);
                
                // Update tracking results
                updateTrackingResults(data);
                
                // Show results
                trackingResults.style.display = 'block';
                
                // Scroll to results
                trackingResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Reset button
                PDEnilexpress.hideLoading(trackBtn, originalBtnText);
            }, 1500);
        };
    }
});