// Global variables
let loginAttempts = 0;
let isLocked = false;
let lockTime = null;
let testDataActive = false;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const attemptsMessage = document.getElementById('attempts-message');
const logoutBtn = document.getElementById('logout-btn');
const testDataBtn = document.getElementById('test-data-btn');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Archive Tab Elements
const archiveTabBtns = document.querySelectorAll('.archive-tab-btn');
const archivePanes = document.querySelectorAll('.archive-pane');

// Modal Elements
const rejectionModal = document.getElementById('rejection-modal');
const rejectionForm = document.getElementById('rejection-form');
const closeModal = document.querySelector('.close');

// Chart Variables
let userGrowthChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginTime = localStorage.getItem('loginTime');
    
    // Check if session is still valid (8 hours)
    if (isLoggedIn && loginTime) {
        const currentTime = new Date().getTime();
        const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        if (currentTime - parseInt(loginTime) < sessionDuration) {
            showAdminPanel();
            loadData();
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginTime');
        }
    }
    
    // Check if authentication is locked
    checkAuthLock();
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // Archive tab navigation
    archiveTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchArchiveTab(btn.dataset.archive);
        });
    });
    
    // Modal close button
    closeModal.addEventListener('click', () => {
        rejectionModal.style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === rejectionModal) {
            rejectionModal.style.display = 'none';
        }
    });
    
    // Rejection form submission
    rejectionForm.addEventListener('submit', handleRejection);
    
    // Export buttons
    document.getElementById('export-users').addEventListener('click', exportUserData);
    document.getElementById('export-rewards').addEventListener('click', exportRewardData);
    
    // Test data button
    testDataBtn.addEventListener('click', toggleTestData);
    
    // Time filter buttons for chart
    document.querySelectorAll('.time-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateChart(btn.dataset.period);
        });
    });
    
    // Search functionality
    document.getElementById('user-search').addEventListener('input', searchUsers);
}

function checkAuthLock() {
    const lockTimeStr = localStorage.getItem('lockTime');
    
    if (lockTimeStr) {
        const currentTime = new Date().getTime();
        const lockDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        if (currentTime - parseInt(lockTimeStr) < lockDuration) {
            isLocked = true;
            lockTime = parseInt(lockTimeStr);
            updateAttemptsMessage(true);
        } else {
            localStorage.removeItem('lockTime');
            localStorage.removeItem('loginAttempts');
            loginAttempts = 0;
            isLocked = false;
            lockTime = null;
        }
    } else {
        loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    if (isLocked) {
        attemptsMessage.textContent = 'Authentication locked. Please try again in 2 hours.';
        return;
    }
    
    const adminId = document.getElementById('admin-id').value;
    const password = document.getElementById('password').value;
    
    // Simple validation (in a real app, this would be done on the server)
    if (adminId === 'admin' && password === 'admin123') {
        // Successful login
        loginAttempts = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockTime');
        
        // Set login session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', new Date().getTime().toString());
        
        showAdminPanel();
        loadData();
    } else {
        // Failed login
        loginAttempts++;
        localStorage.setItem('loginAttempts', loginAttempts.toString());
        
        if (loginAttempts >= 3) {
            // Lock authentication for 2 hours
            isLocked = true;
            lockTime = new Date().getTime();
            localStorage.setItem('lockTime', lockTime.toString());
            updateAttemptsMessage(true);
            
            // Send security alert (simulated)
            sendSecurityAlert();
        } else {
            updateAttemptsMessage(false);
        }
    }
}

function updateAttemptsMessage(locked) {
    if (locked) {
        attemptsMessage.textContent = 'Authentication locked. Please try again in 2 hours.';
    } else {
        attemptsMessage.textContent = `Invalid credentials. ${3 - loginAttempts} attempts remaining.`;
    }
}

function sendSecurityAlert() {
    // In a real application, this would send an email to the admin
    console.log('Security alert: Multiple failed login attempts detected.');
}

function showAdminPanel() {
    authScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    authScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    
    // Reset form
    loginForm.reset();
}

function switchTab(tabId) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab panes
    tabPanes.forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.add('active');
            
            // Load data for the tab if needed
            if (tabId === 'user-growth' && !userGrowthChart) {
                initUserGrowthChart();
            }
        } else {
            pane.classList.remove('active');
        }
    });
}

function switchArchiveTab(archiveId) {
    // Update archive tab buttons
    archiveTabBtns.forEach(btn => {
        if (btn.dataset.archive === archiveId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update archive panes
    archivePanes.forEach(pane => {
        if (pane.id === `${archiveId}-archive`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
}

function loadData() {
    // In a real application, this would fetch data from APIs
    // For now, we'll use dummy data or test data if enabled
    
    if (testDataActive) {
        loadTestData();
    } else {
        // Load empty or default data
        document.getElementById('total-users').textContent = '0';
        document.getElementById('total-views').textContent = '0';
        document.getElementById('total-redeemed').textContent = '0';
        
        // Clear tables
        document.getElementById('new-users-table').innerHTML = '';
        document.getElementById('reward-requests-table').innerHTML = '';
        document.getElementById('reward-history-table').innerHTML = '';
        document.getElementById('archived-users-table').innerHTML = '';
        document.getElementById('archived-rewards-table').innerHTML = '';
    }
}

function loadTestData() {
    // Update stats
    document.getElementById('total-users').textContent = '1,254';
    document.getElementById('total-views').textContent = '45,678';
    document.getElementById('total-redeemed').textContent = '342';
    
    // Generate test users
    const testUsers = generateTestUsers(15);
    populateUsersTable(testUsers, 'new-users-table');
    
    // Generate test reward requests
    const testRewardRequests = generateTestRewardRequests(8);
    populateRewardRequestsTable(testRewardRequests);
    
    // Generate test reward history
    const testRewardHistory = generateTestRewardHistory(12);
    populateRewardHistoryTable(testRewardHistory);
    
    // Generate test archived users
    const testArchivedUsers = generateTestUsers(6, true);
    populateArchivedUsersTable(testArchivedUsers);
    
    // Generate test archived rewards
    const testArchivedRewards = generateTestRewardHistory(10, true);
    populateArchivedRewardsTable(testArchivedRewards);
    
    // Initialize chart if needed
    if (document.getElementById('user-growth-chart') && !userGrowthChart) {
        initUserGrowthChart();
    }
}

function generateTestUsers(count, archived = false) {
    const users = [];
    const firstNames = ['John', 'Jane', 'Robert', 'Emily', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Amanda'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const genders = ['Male', 'Female', 'Other'];
    
    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
        const mobile = Math.random() > 0.2 ? `+1${Math.floor(1000000000 + Math.random() * 9000000000)}` : '';
        const registeredDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
        
        users.push({
            id: `UID${1000 + i}`,
            name: `${firstName} ${lastName}`,
            email: email,
            mobile: mobile,
            gender: genders[Math.floor(Math.random() * genders.length)],
            registeredOn: registeredDate.toLocaleDateString(),
            exported: archived ? (Math.random() > 0.5 ? exportedDate() : '') : undefined
        });
    }
    
    return users;
}

function generateTestRewardRequests(count) {
    const requests = [];
    const rewards = ['$10 Gift Card', 'Free Subscription', 'Discount Coupon', 'Premium Account', 'Free E-book'];
    const methods = ['Bank Transfer', 'UPI', 'PayPal', 'Credit Card'];
    const statuses = ['pending', 'pending', 'pending', 'approved', 'rejected']; // More pending for testing
    
    for (let i = 1; i <= count; i++) {
        const userId = `UID${1000 + i}`;
        const firstName = ['John', 'Jane', 'Robert', 'Emily', 'Michael'][Math.floor(Math.random() * 5)];
        const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        requests.push({
            rid: `RID${2000 + i}`,
            userId: userId,
            name: `${firstName} ${lastName}`,
            reward: rewards[Math.floor(Math.random() * rewards.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            details: generatePaymentDetails(),
            status: status,
            actionTime: status !== 'pending' ? new Date().toLocaleString() : ''
        });
    }
    
    return requests;
}

function generateTestRewardHistory(count, archived = false) {
    const history = [];
    const rewards = ['$10 Gift Card', 'Free Subscription', 'Discount Coupon', 'Premium Account', 'Free E-book'];
    const statuses = ['approved', 'rejected'];
    
    for (let i = 1; i <= count; i++) {
        const userId = `UID${1000 + i}`;
        const firstName = ['John', 'Jane', 'Robert', 'Emily', 'Michael'][Math.floor(Math.random() * 5)];
        const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const actionTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
        
        history.push({
            rid: `RID${2000 + i}`,
            userId: userId,
            name: `${firstName} ${lastName}`,
            reward: rewards[Math.floor(Math.random() * rewards.length)],
            status: status,
            actionTime: actionTime.toLocaleDateString(),
            rejectionReason: status === 'rejected' ? ['Invalid details', 'Already claimed', 'Not eligible'][Math.floor(Math.random() * 3)] : '',
            exported: archived ? (Math.random() > 0.5 ? exportedDate() : '') : undefined
        });
    }
    
    return history;
}

function generatePaymentDetails() {
    const methods = {
        'Bank Transfer': `Account: XXXXXX7890\nIFSC: ABCD0123456`,
        'UPI': `UPI ID: xxxxxxxx@ybl`,
        'PayPal': `PayPal ID: user@example.com`,
        'Credit Card': `Card: XXXX-XXXX-XXXX-1234\nExp: 12/25`
    };
    
    const method = ['Bank Transfer', 'UPI', 'PayPal', 'Credit Card'][Math.floor(Math.random() * 4)];
    return methods[method];
}

function exportedDate() {
    return new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString();
}

function populateUsersTable(users, tableId) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.mobile || 'N/A'}</td>
            <td>${user.gender}</td>
            <td>${user.registeredOn}</td>
            ${user.exported !== undefined ? `<td>${user.exported || 'No'}</td>` : ''}
            ${user.exported !== undefined ? `
                <td>
                    <button class="action-btn export-btn" data-id="${user.id}">Export</button>
                    <button class="action-btn delete-btn" data-id="${user.id}" ${user.exported ? '' : 'disabled'}>Delete</button>
                </td>
            ` : ''}
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons if this is an archive table
    if (tableId === 'archived-users-table') {
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                exportSingleUser(userId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                deleteSingleUser(userId);
            });
        });
    }
}

function populateRewardRequestsTable(requests) {
    const tableBody = document.getElementById('reward-requests-table');
    tableBody.innerHTML = '';
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.rid}</td>
            <td>${request.userId}</td>
            <td>${request.name}</td>
            <td>${request.reward}</td>
            <td>${request.method}</td>
            <td>${request.details.replace(/\n/g, '<br>')}</td>
            <td>
                ${request.status === 'pending' ? `
                    <button class="action-btn btn-approve" data-rid="${request.rid}">Approve</button>
                    <button class="action-btn btn-reject" data-rid="${request.rid}">Reject</button>
                ` : request.actionTime}
            </td>
            <td><span class="status-badge status-${request.status}">${request.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rid = e.target.dataset.rid;
            approveRewardRequest(rid);
        });
    });
    
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rid = e.target.dataset.rid;
            openRejectionModal(rid);
        });
    });
}

function populateRewardHistoryTable(history) {
    const tableBody = document.getElementById('reward-history-table');
    tableBody.innerHTML = '';
    
    history.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.rid}</td>
            <td>${item.userId}</td>
            <td>${item.name}</td>
            <td>${item.reward}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td>${item.actionTime}</td>
            <td>${item.rejectionReason || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function populateArchivedUsersTable(users) {
    populateUsersTable(users, 'archived-users-table');
}

function populateArchivedRewardsTable(rewards) {
    const tableBody = document.getElementById('archived-rewards-table');
    tableBody.innerHTML = '';
    
    rewards.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.rid}</td>
            <td>${item.userId}</td>
            <td>${item.name}</td>
            <td>${item.reward}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td>${item.actionTime}</td>
            <td>${item.exported || 'No'}</td>
            <td>
                <button class="action-btn export-btn" data-rid="${item.rid}">Export</button>
                <button class="action-btn delete-btn" data-rid="${item.rid}" ${item.exported ? '' : 'disabled'}>Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rid = e.target.dataset.rid;
            exportSingleReward(rid);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rid = e.target.dataset.rid;
            deleteSingleReward(rid);
        });
    });
}

function initUserGrowthChart() {
    const ctx = document.getElementById('user-growth-chart').getContext('2d');
    
    // Generate sample data
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const userData = [120, 240, 380, 520];
    const viewData = [800, 1500, 2200, 3000];
    
    userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: 'Registered Users',
                    data: userData,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Views Count',
                    data: viewData,
                    borderColor: '#f72585',
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart(period) {
    // This would fetch new data based on the period in a real application
    // For now, we'll just adjust the current data slightly
    
    if (userGrowthChart) {
        const weeks = period === 'week' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                     period === 'month' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] :
                     ['2019', '2020', '2021', '2022', '2023'];
        
        userGrowthChart.data.labels = weeks;
        
        // Generate random data for demonstration
        userGrowthChart.data.datasets[0].data = weeks.map(() => Math.floor(Math.random() * 1000));
        userGrowthChart.data.datasets[1].data = weeks.map(() => Math.floor(Math.random() * 5000));
        
        userGrowthChart.update();
    }
}

function openRejectionModal(rid) {
    document.getElementById('reject-rid').value = rid;
    rejectionModal.style.display = 'block';
}

function handleRejection(e) {
    e.preventDefault();
    const rid = document.getElementById('reject-rid').value;
    const reason = document.getElementById('rejection-reason').value;
    
    rejectRewardRequest(rid, reason);
    
    // Close modal and reset form
    rejectionModal.style.display = 'none';
    rejectionForm.reset();
}

function approveRewardRequest(rid) {
    // In a real application, this would send an API request
    console.log(`Approving reward request: ${rid}`);
    
    // Update UI
    const row = document.querySelector(`button[data-rid="${rid}"]`).closest('tr');
    const statusCell = row.querySelector('.status-badge');
    
    statusCell.textContent = 'approved';
    statusCell.className = 'status-badge status-approved';
    
    const actionCell = row.querySelector('td:nth-child(7)');
    actionCell.innerHTML = new Date().toLocaleString();
    
    // Remove action buttons
    const actionButtons = row.querySelector('td:nth-child(7)');
    actionButtons.innerHTML = actionButtons.textContent;
    
    // Move to reward history after a delay (simulation)
    setTimeout(() => {
        row.remove();
        // In a real app, we would add this to the history table
    }, 1000);
}

function rejectRewardRequest(rid, reason) {
    // In a real application, this would send an API request
    console.log(`Rejecting reward request: ${rid} with reason: ${reason}`);
    
    // Update UI
    const row = document.querySelector(`button[data-rid="${rid}"]`).closest('tr');
    const statusCell = row.querySelector('.status-badge');
    
    statusCell.textContent = 'rejected';
    statusCell.className = 'status-badge status-rejected';
    
    const actionCell = row.querySelector('td:nth-child(7)');
    actionCell.innerHTML = new Date().toLocaleString();
    
    // Add rejection reason to the table (we'd need an additional cell)
    const newCell = row.insertCell(7);
    newCell.textContent = reason;
    
    // Remove action buttons
    const actionButtons = row.querySelector('td:nth-child(7)');
    actionButtons.innerHTML = actionButtons.textContent;
    
    // Move to reward history after a delay (simulation)
    setTimeout(() => {
        row.remove();
        // In a real app, we would add this to the history table
    }, 1000);
}

function exportUserData() {
    // In a real application, this would generate and download a file
    console.log('Exporting user data...');
    alert('User data exported successfully!');
}

function exportRewardData() {
    // In a real application, this would generate and download a file
    console.log('Exporting reward data...');
    alert('Reward data exported successfully!');
}

function exportSingleUser(userId) {
    // In a real application, this would export a single user's data
    console.log(`Exporting data for user: ${userId}`);
    
    // Update UI
    const row = document.querySelector(`button[data-id="${userId}"]`).closest('tr');
    const exportedCell = row.cells[6];
    exportedCell.textContent = new Date().toLocaleDateString();
    
    // Enable delete button
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.disabled = false;
}

function deleteSingleUser(userId) {
    // In a real application, this would delete the user's data
    console.log(`Deleting data for user: ${userId}`);
    
    // Update UI
    const row = document.querySelector(`button[data-id="${userId}"]`).closest('tr');
    row.remove();
    
    // Update deleted count (would need an element to display this)
}

function exportSingleReward(rid) {
    // In a real application, this would export a single reward's data
    console.log(`Exporting data for reward: ${rid}`);
    
    // Update UI
    const row = document.querySelector(`button[data-rid="${rid}"]`).closest('tr');
    const exportedCell = row.cells[6];
    exportedCell.textContent = new Date().toLocaleDateString();
    
    // Enable delete button
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.disabled = false;
}

function deleteSingleReward(rid) {
    // In a real application, this would delete the reward's data
    console.log(`Deleting data for reward: ${rid}`);
    
    // Update UI
    const row = document.querySelector(`button[data-rid="${rid}"]`).closest('tr');
    row.remove();
}

function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.getElementById('new-users-table').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
    }
}

function toggleTestData() {
    testDataActive = !testDataActive;
    
    if (testDataActive) {
        testDataBtn.style.backgroundColor = '#4cc9f0';
        loadTestData();
    } else {
        testDataBtn.style.backgroundColor = '#fca311';
        loadData();
    }
}
