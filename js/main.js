// Main JavaScript Logic
const currentUser = DataStore.getCurrentUser();

// --- Auth Handling ---
function handleLogin(e) {
    if (e) e.preventDefault();
    const roleInput = document.querySelector('input[name="role"]:checked')?.value || 'teacher';
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    const res = DataStore.login(email, pass);
    if (res.success) {
        if (res.user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        alert(res.message);
    }
}

function handleRegister(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    const res = DataStore.register(name, email, pass);
    if (res.success) {
        alert('Welcome ' + name + '! Please login.');
        showLoginModal();
    } else {
        alert(res.message);
    }
}

// --- Dashboard Logic ---
if (window.location.pathname.includes('dashboard.html')) {
    if (!currentUser) window.location.href = 'index.html'; // Protect route

    // Update Header
    document.getElementById('user-name-display').textContent = currentUser.name;
    document.getElementById('user-balance-display').textContent = currentUser.balance + ' Hours';
    document.getElementById('balance-large').textContent = currentUser.balance + ' hrs';

    // Load Bookings History
    const myBookings = DataStore.getBookings().filter(b => b.userId === currentUser.username);
    const historyTable = document.getElementById('booking-history-body');
    if (historyTable) {
        historyTable.innerHTML = myBookings.length === 0
            ? '<tr><td colspan="4" style="text-align: center;">No bookings yet.</td></tr>'
            : myBookings.map(b => `
                <tr>
                    <td>${b.date}</td>
                    <td>${b.slots.join(', ')}</td>
                    <td>${b.slots.length} Hours</td>
                    <td><span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></td>
                </tr>
            `).join('');
    }

    // Load Packages for Purchase
    const packagesContainer = document.getElementById('packages-list');
    if (packagesContainer) {
        const pkgs = DataStore.getPackages();
        packagesContainer.innerHTML = pkgs.map(p => `
            <div class="card pricing-card">
                <h3>${p.name}</h3>
                <h2>Rs. ${p.price}</h2>
                <p>${p.hours} Hours</p>
                <button class="btn btn-outline" onclick="buyPackage(${p.id})">Buy Now</button>
            </div>
        `).join('');
    }
}

// --- Admin Logic ---
if (window.location.pathname.includes('admin.html')) {
    if (!currentUser || currentUser.role !== 'admin') window.location.href = 'index.html';

    // Mock Stats
    const allBookings = DataStore.getBookings();
    document.getElementById('total-bookings').textContent = allBookings.length;
    document.getElementById('pending-bookings').textContent = allBookings.filter(b => b.status === 'Pending').length;

    // Load Pending Requests
    const pendingTable = document.getElementById('pending-requests-body');
    if (pendingTable) {
        const pending = allBookings.filter(b => b.status === 'Pending');
        pendingTable.innerHTML = pending.length === 0
            ? '<tr><td colspan="5" style="text-align: center;">No pending requests.</td></tr>'
            : pending.map(b => `
                <tr>
                    <td>${b.userName}</td>
                    <td>${b.date} <br> <small>${b.slots.join(', ')}</small></td>
                    <td>Rs. ${b.cost} (${b.method})</td>
                    <td><span class="status-badge status-pending">Pending</span></td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="approveBooking('${b.id}')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectBooking('${b.id}')">Reject</button>
                    </td>
                </tr>
            `).join('');
    }
}


// --- Actions ---
function buyPackage(pkgId) {
    const pkg = DataStore.getPackages().find(p => p.id === pkgId);
    if (confirm(`Confirm purchase of ${pkg.name} for Rs. ${pkg.price}?`)) {
        // In real app, redirect to payment gateway here
        // For demo, just credit the account
        DataStore.updateUserBalance(currentUser.username, pkg.hours);
        alert('Package purchased successfully! Hours added to your account.');
        location.reload();
    }
}

function confirmBooking() {
    const date = document.getElementById('booking-date').value;
    if (!date || selectedSlots.length === 0) {
        alert('Please select a date and at least one time slot.');
        return;
    }

    const available = DataStore.checkAvailability(date, selectedSlots); // Mock function need to implement properly in store but for now just proceed
    // Actually, let's implement basic conflict check in UI

    const method = document.getElementById('payment-method').value;
    const cost = selectedSlots.length * 500; // Rs. 500 per hour rate

    if (method === 'wallet' && currentUser.balance < selectedSlots.length) {
        alert('Insufficient balance! Please top up.');
        return;
    }

    const booking = {
        userId: currentUser.username,
        userName: currentUser.name,
        date: date,
        slots: selectedSlots,
        cost: cost,
        method: method,
        status: 'Pending'
    };

    if (method === 'wallet') {
        booking.status = 'Confirmed'; // Immediate confirmation if paying by wallet
        DataStore.updateUserBalance(currentUser.username, -selectedSlots.length);
    }

    DataStore.createBooking(booking);
    alert('Booking submitted successfully!');
    loadPage('dashboard');
}

function approveBooking(id) {
    if (confirm('Approve this booking?')) {
        DataStore.updateBookingStatus(id, 'Confirmed');
        location.reload();
    }
}

function rejectBooking(id) {
    if (confirm('Reject this booking?')) {
        DataStore.updateBookingStatus(id, 'Rejected');
        location.reload();
    }
}
