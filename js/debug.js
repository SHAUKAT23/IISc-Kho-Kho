// Debug helper script for IISc Kho-Kho App
console.log("Debug helper loaded");

// Add global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.message, 'at', event.filename, ':', event.lineno);
    
    // Add error to debug info panel if it exists
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.innerHTML = `Error: ${event.message}<br>At: ${event.filename}:${event.lineno}`;
        debugInfo.appendChild(errorDiv);
    }
});

// Add promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Add error to debug info panel if it exists
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.innerHTML = `Promise Error: ${event.reason}`;
        debugInfo.appendChild(errorDiv);
    }
});

// Function to check page loading status
function checkPageLoading() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }
    
    console.log('Content area HTML:', contentArea.innerHTML.substring(0, 100) + '...');
    
    // Check if Firebase is available
    if (window.firebase) {
        console.log('Firebase is available globally');
    } else {
        console.error('Firebase is not available globally');
    }
    
    // Check if Vue is available
    if (window.Vue) {
        console.log('Vue is available globally');
    } else {
        console.error('Vue is not available globally');
    }
}

// Run check after a short delay
setTimeout(checkPageLoading, 2000);

// Export debug functions
window.debugHelpers = {
    checkPageLoading: checkPageLoading,
    testFirebase: function() {
        if (window.db) {
            window.db.collection('players').get()
                .then(snapshot => {
                    console.log('Firebase test successful, found', snapshot.size, 'players');
                })
                .catch(err => {
                    console.error('Firebase test failed:', err);
                });
        } else {
            console.error('Firestore db not available');
        }
    }
};
