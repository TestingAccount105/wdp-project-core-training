function initializeCharts(channelData, messageData, serverData) {
    // Channel Statistics Chart
    const channelCtx = document.getElementById('channelChart').getContext('2d');
    new Chart(channelCtx, {
        type: 'bar',
        data: {
            labels: ['Categories', 'Text Cha...', 'Voice Ch...'],
            datasets: [{
                data: [5, 17, 4],
                backgroundColor: [
                    '#3498db',
                    '#5865f2',
                    '#5865f2'
                ],
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: {
                        stepSize: 5,
                        color: '#95a5a6'
                    },
                    grid: {
                        color: '#34495e'
                    }
                },
                x: {
                    ticks: {
                        color: '#95a5a6'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Message Statistics Chart
    const messageCtx = document.getElementById('messageChart').getContext('2d');
    new Chart(messageCtx, {
        type: 'bar',
        data: {
            labels: ['Total Me...', 'Today', 'Remaining'],
            datasets: [{
                data: [messageData.total, messageData.today, messageData.remaining],
                backgroundColor: [
                    '#2ecc71',
                    '#2ecc71',
                    '#2ecc71'
                ],
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        color: '#95a5a6'
                    },
                    grid: {
                        color: '#34495e'
                    }
                },
                x: {
                    ticks: {
                        color: '#95a5a6'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Server Statistics Chart
    const serverCtx = document.getElementById('serverChart').getContext('2d');
    new Chart(serverCtx, {
        type: 'bar',
        data: {
            labels: ['Public S...', 'Private'],
            datasets: [{
                data: [serverData.public_servers || 8, serverData.private_servers || 17],
                backgroundColor: [
                    '#9b59b6',
                    '#9b59b6'
                ],
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: {
                        stepSize: 5,
                        color: '#95a5a6'
                    },
                    grid: {
                        color: '#34495e'
                    }
                },
                x: {
                    ticks: {
                        color: '#95a5a6'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Add mobile menu button if needed
if (window.innerWidth <= 768) {
    const mainContent = document.querySelector('.main-content');
    const menuButton = document.createElement('button');
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