// Chart configuration with tooltips
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3498db',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
                title: function(context) {
                    return context[0].label;
                },
                label: function(context) {
                    const dataPoint = context.raw;
                    const dataset = context.dataset;
                    const dataIndex = context.dataIndex;
                    
                    // Get additional info from dataset
                    const additionalInfo = dataset.additionalInfo ? dataset.additionalInfo[dataIndex] : null;
                    
                    let label = `Count: ${dataPoint}`;
                    if (additionalInfo && additionalInfo.description) {
                        label += `\n${additionalInfo.description}`;
                    }
                    
                    return label;
                },
                afterLabel: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((context.raw / total) * 100).toFixed(1);
                    return `Percentage: ${percentage}%`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                color: '#95a5a6',
                callback: function(value) {
                    return Number.isInteger(value) ? value : '';
                }
            },
            grid: {
                color: '#34495e'
            }
        },
        x: {
            ticks: {
                color: '#95a5a6',
                maxRotation: 45,
                minRotation: 0
            },
            grid: {
                display: false
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    },
    animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
    }
};

// Store chart instances globally
let chartInstances = {
    channelChart: null,
    messageChart: null,
    serverChart: null
};

// Fetch chart data from API
async function fetchChartData(type = null) {
    try {
        const url = type ? `chart.php?type=${type}` : 'chart.php';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return null;
    }
}

// Destroy existing chart if it exists
function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        chartInstances[chartId] = null;
    }
}

// Initialize Channel Statistics Chart
async function initializeChannelChart() {
    const channelData = await fetchChartData('channels');
    
    if (!channelData) {
        console.error('Failed to load channel data');
        return;
    }
    
    const canvasElement = document.getElementById('channelChart');
    if (!canvasElement) {
        console.error('Canvas element channelChart not found');
        return;
    }
    
    // Destroy existing chart
    destroyChart('channelChart');
    
    const ctx = canvasElement.getContext('2d');
    
    // Prepare data for chart
    const labels = channelData.map(item => {
        // Truncate long labels for display
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = channelData.map(item => item.count);
    const colors = ['#3498db', '#5865f2', '#9b59b6']; // Blue, Discord Blue, Purple
    
    chartInstances.channelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: channelData.map(item => ({
                    description: `${item.display_name}: ${item.count} channels`,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + 5
                }
            }
        }
    });
}

// Initialize Message Statistics Chart
async function initializeMessageChart() {
    const messageData = await fetchChartData('messages');
    
    if (!messageData) {
        console.error('Failed to load message data');
        return;
    }
    
    const canvasElement = document.getElementById('messageChart');
    if (!canvasElement) {
        console.error('Canvas element messageChart not found');
        return;
    }
    
    // Destroy existing chart
    destroyChart('messageChart');
    
    const ctx = canvasElement.getContext('2d');
    
    // Prepare data for chart
    const labels = messageData.map(item => {
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = messageData.map(item => item.count);
    const colors = ['#2ecc71', '#27ae60', '#1abc9c']; // Different shades of green
    
    chartInstances.messageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: messageData.map(item => ({
                    description: item.description,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + Math.ceil(Math.max(...counts) * 0.1)
                }
            }
        }
    });
}

// Initialize Server Statistics Chart
async function initializeServerChart() {
    const serverData = await fetchChartData('servers');
    
    if (!serverData) {
        console.error('Failed to load server data');
        return;
    }
    
    const canvasElement = document.getElementById('serverChart');
    if (!canvasElement) {
        console.error('Canvas element serverChart not found');
        return;
    }
    
    // Destroy existing chart
    destroyChart('serverChart');
    
    const ctx = canvasElement.getContext('2d');
    
    // Prepare data for chart
    const labels = serverData.map(item => {
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = serverData.map(item => item.count);
    const colors = ['#9b59b6', '#8e44ad']; // Purple shades
    
    chartInstances.serverChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: serverData.map(item => ({
                    description: item.description,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + 5
                }
            }
        }
    });
}

// Destroy all chart instances
function destroyAllCharts() {
    Object.keys(chartInstances).forEach(chartId => {
        destroyChart(chartId);
    });
}

// Initialize all charts
async function initializeAllCharts() {
    try {
        console.log('Initializing charts...');
        
        // Show loading indicators
        showLoadingIndicators();
        
        // Destroy existing charts first
        destroyAllCharts();
        
        // Initialize all charts concurrently
        await Promise.all([
            initializeChannelChart(),
            initializeMessageChart(),
            initializeServerChart()
        ]);
        
        // Hide loading indicators
        hideLoadingIndicators();
        
        console.log('All charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
        hideLoadingIndicators();
        showErrorMessage('Failed to load chart data. Please refresh the page.');
    }
}

// Show loading indicators
function showLoadingIndicators() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.style.opacity = '0.5';
        }
        
        // Remove existing loading indicator
        const existingLoader = container.querySelector('.chart-loading');
        if (existingLoader) {
            existingLoader.remove();
        }
        
        // Add loading spinner
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chart-loading';
        loadingDiv.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #3498db;
                font-size: 14px;
                text-align: center;
                z-index: 10;
            ">
                <div style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid #34495e;
                    border-top: 2px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                "></div>
                Loading chart data...
            </div>
        `;
        container.style.position = 'relative';
        container.appendChild(loadingDiv);
    });
    
    // Add CSS animation for spinner
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Hide loading indicators
function hideLoadingIndicators() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.style.opacity = '1';
        }
        
        const loadingDiv = container.querySelector('.chart-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    });
}

// Show error message
function showErrorMessage(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.chart-error-message');
    existingErrors.forEach(error => error.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Refresh chart data
async function refreshChartData() {
    const refreshButton = document.getElementById('refresh-charts');
    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = 'Refreshing...';
    }
    
    // Reinitialize charts (destroyAllCharts is called within initializeAllCharts)
    await initializeAllCharts();
    
    if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh Charts';
    }
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing charts...');
    
    // Initialize charts
    initializeAllCharts();
    
    // Add refresh button
    const activitySection = document.querySelector('.activity-section h2');
    if (activitySection) {
        // Remove existing refresh button if it exists
        const existingButton = document.getElementById('refresh-charts');
        if (existingButton) {
            existingButton.remove();
        }
        
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-charts';
        refreshButton.textContent = 'Refresh Charts';
        refreshButton.style.cssText = `
            float: right;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 20px;
            transition: background-color 0.3s;
        `;
        refreshButton.onmouseover = function() {
            this.style.backgroundColor = '#2980b9';
        };
        refreshButton.onmouseout = function() {
            this.style.backgroundColor = '#3498db';
        };
        refreshButton.onclick = refreshChartData;
        activitySection.appendChild(refreshButton);
    }
    
    // Add mobile menu button if needed
    if (window.innerWidth <= 768) {
        // Remove existing menu button if it exists
        const existingMenuButton = document.querySelector('.mobile-menu-button');
        if (existingMenuButton) {
            existingMenuButton.remove();
        }
        
        const menuButton = document.createElement('button');
        menuButton.className = 'mobile-menu-button';
        menuButton.innerHTML = '☰';
        menuButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            font-size: 18px;
            cursor: pointer;
        `;
        menuButton.onclick = toggleSidebar;
        document.body.appendChild(menuButton);
    }
});

// Clean up charts when page is about to unload
window.addEventListener('beforeunload', function() {
    destroyAllCharts();
});

// Legacy function for backward compatibility
function initializeCharts() {
    initializeAllCharts();
}