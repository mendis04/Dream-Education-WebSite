/**
 * Dream Education - Local Data Store
 * Simulates a database using Browser LocalStorage
 */

const DB_KEYS = {
    USERS: 'de_users',
    BOOKINGS: 'de_bookings',
    PACKAGES: 'de_packages',
    CURRENT_USER: 'de_current_user'
};

// Default Data Initialization
const DEFAULT_PACKAGES = [
    { id: 1, name: 'Starter', price: 2000, hours: 5, description: 'Basic 5 Hour Pack', features: ['Valid 30 Days', 'Basic Support'] },
    { id: 2, name: 'Professional', price: 5000, hours: 15, description: 'Standard 15 Hour Pack', features: ['Most Popular', 'Priority Booking'] },
    { id: 3, name: 'Ultimate', price: 10000, hours: 35, description: 'Premium 35 Hour Pack', features: ['Best Value', '24/7 Support'] }
];

const DEFAULT_ADMIN = {
    username: 'mendis',
    password: 'mendis0530', // In a real app, this would be hashed!
    role: 'admin',
    name: 'B.A.M. Mendis'
};

const DataStore = {
    // --- Initialization ---
    init() {
        if (!localStorage.getItem(DB_KEYS.PACKAGES)) {
            localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
        }
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
        }
        if (!localStorage.getItem(DB_KEYS.BOOKINGS)) {
            localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify([]));
        }
    },

    // --- User Management ---
    login(username, password) {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    register(name, username, password) {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            username,
            password,
            name,
            role: 'teacher',
            balance: 0, // Hours
            joinedAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        // Auto login
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(newUser));
        return { success: true, user: newUser };
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
    },

    logout() {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
    },

    updateUserBalance(username, hoursToAdd) {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users[userIndex].balance = (users[userIndex].balance || 0) + hoursToAdd;
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

            // Update session if it's the current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.username === username) {
                currentUser.balance = users[userIndex].balance;
                localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(currentUser));
            }
        }
    },

    // --- Booking Management ---
    createBooking(bookingDetails) {
        const bookings = JSON.parse(localStorage.getItem(DB_KEYS.BOOKINGS) || '[]');
        const newBooking = {
            id: Date.now().toString(),
            status: 'Pending', // Pending, Confirmed, Rejected, Completed
            createdAt: new Date().toISOString(),
            ...bookingDetails
        };
        bookings.push(newBooking);
        localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(bookings));
        return newBooking;
    },

    getBookings() {
        return JSON.parse(localStorage.getItem(DB_KEYS.BOOKINGS) || '[]');
    },

    updateBookingStatus(bookingId, status) {
        const bookings = JSON.parse(localStorage.getItem(DB_KEYS.BOOKINGS) || '[]');
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            bookings[index].status = status;
            localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(bookings));
            return true;
        }
        return false;
    },

    checkAvailability(date, timeSlots) {
        const bookings = this.getBookings();
        // Filter confirmed or pending bookings for the same date
        const activeBookings = bookings.filter(b =>
            b.date === date &&
            (b.status === 'Confirmed' || b.status === 'Pending')
        );

        // Check if any requested slot overlaps
        for (const booking of activeBookings) {
            for (const slot of booking.slots) {
                if (timeSlots.includes(slot)) {
                    return false; // Conflict found
                }
            }
        }
        return true;
    },

    // --- Package Management ---
    getPackages() {
        return JSON.parse(localStorage.getItem(DB_KEYS.PACKAGES) || '[]');
    },

    savePackage(pkg) {
        const packages = this.getPackages();
        if (pkg.id) {
            // Update
            const index = packages.findIndex(p => p.id === pkg.id);
            if (index !== -1) packages[index] = pkg;
        } else {
            // Create
            pkg.id = Date.now();
            packages.push(pkg);
        }
        localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(packages));
    },

    deletePackage(id) {
        let packages = this.getPackages();
        packages = packages.filter(p => p.id !== id);
        localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(packages));
    }
};

// Initialize on load
DataStore.init();
