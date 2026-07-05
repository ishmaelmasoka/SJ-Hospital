// ==================== LOCAL STORAGE DATABASE ====================
const STORAGE_KEYS = {
    DOCTORS: 'sjh_doctors',
    APPOINTMENTS: 'sjh_appointments',
    SESSION: 'sjh_doctor_session'
};

// Initialize default data
function initDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
        const defaultDoctors = [
            { id: 1, name: "Dr. Sarah Johnson", username: "sarah.j", password: "doc123", start_hour: 9, end_hour: 17 },
            { id: 2, name: "Dr. Michael Chen", username: "michael.c", password: "med456", start_hour: 14, end_hour: 22 },
            { id: 3, name: "Dr. Emily Okonkwo", username: "emily.o", password: "care789", start_hour: 8, end_hour: 14 }
        ];
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(defaultDoctors));
        console.log("Doctors initialized:", defaultDoctors);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
        console.log("Appointments initialized");
    }
}

// Database helpers
function getDoctors() {
    const doctors = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCTORS)) || [];
    console.log("Getting doctors:", doctors);
    return doctors;
}

function getAppointments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
}

function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
}

// Session management
function getDoctorSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
}

function setDoctorSession(doc) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(doc));
}

function clearDoctorSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// Date/Time utilities
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
    let [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
}

function isWithinWorkingHours(startHour, endHour, timeStr) {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (startHour < endHour) {
        return hour >= startHour && hour < endHour;
    } else {
        return hour >= startHour || hour < endHour;
    }
}

function showMessage(element, type, text) {
    element.className = `message ${type}`;
    element.textContent = text;
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== PAGE RENDERING ====================
let currentDoctorsCache = [];

async function render() {
    console.log("Render called, hash:", window.location.hash);
    const appDiv = document.getElementById('app');
    if (!appDiv) {
        console.error("App div not found!");
        return;
    }
    
    const hash = window.location.hash.slice(1) || 'home';
    
    try {
        if (hash === 'home') {
            appDiv.innerHTML = renderHome();
        } else if (hash === 'book') {
            // Load doctors before rendering booking page
            currentDoctorsCache = getDoctors();
            console.log("Doctors loaded for booking:", currentDoctorsCache);
            appDiv.innerHTML = renderBooking();
            attachBookingEvents();
        } else if (hash === 'login') {
            currentDoctorsCache = getDoctors();
            appDiv.innerHTML = renderLogin();
            attachLoginEvents();
        } else if (hash === 'dashboard') {
            const session = getDoctorSession();
            if (!session) {
                window.location.hash = 'login';
                return;
            }
            appDiv.innerHTML = renderDashboard(session);
            loadDoctorAppointments(session.id);
            attachDashboardLogout();
        } else {
            appDiv.innerHTML = renderHome();
        }
    } catch (error) {
        console.error("Render error:", error);
        appDiv.innerHTML = '<div class="container" style="text-align:center; padding:2rem;"><h2>Error loading page</h2><p>Please refresh the page</p></div>';
    }
}

// Home Page
function renderHome() {
    return `
        <header class="header">
            <div class="container header-content">
                <div class="logo" onclick="window.location.hash='home'">
                    <span class="logo-icon"></span>
                    <span>SJ Hospital</span>
                </div>
                <nav class="nav">
                    <a class="nav-link active" onclick="window.location.hash='home'">Home</a>
                    <a class="nav-link" onclick="window.location.hash='book'">Book</a>
                    <a class="nav-link" onclick="window.location.hash='login'">Doctor Login</a>
                </nav>
            </div>
        </header>
        <main class="main">
            <div class="container">
                <div class="hero">
                    <h1 class="hero-title">Quality Healthcare at Your Fingertips</h1>
                    <p class="hero-subtitle">Schedule appointments with experienced doctors. Easy, fast, and reliable.</p>
                    <button class="btn btn-primary" onclick="window.location.hash='book'">Book Appointment →</button>
                </div>
                <div class="features-grid">
                    <div class="feature-card">
                        <h3>📅 Easy Scheduling</h3>
                        <p>Book appointments 24/7 with our simple online system.</p>
                    </div>
                    <div class="feature-card">
                        <h3>👨‍⚕️ Expert Doctors</h3>
                        <p>Our team provides quality care with flexible shifts.</p>
                    </div>
                    <div class="feature-card">
                        <h3>📊 Manage Appointments</h3>
                        <p>Doctors can view and update their schedule easily.</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="window.location.hash='login'">Doctor Login →</button>
                </div>
            </div>
        </main>
        <footer>
            <div class="container">
                <p>© 2025 SJ Hospital — Compassionate care, modern system.</p>
            </div>
        </footer>
    `;
}

// Booking Page
function renderBooking() {
    const today = getTodayDate();
    
    // Generate time options (24 hours, 30 min intervals)
    let timeOptions = '';
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour24 = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            const displayHour = h % 12 || 12;
            const ampm = h >= 12 ? 'PM' : 'AM';
            timeOptions += `<option value="${hour24}:${minute}">${displayHour}:${minute} ${ampm}</option>`;
        }
    }
    
    // Generate doctor options - FIXED: Added better error handling and default message
    let docOptions = '';
    if (currentDoctorsCache && currentDoctorsCache.length > 0) {
        docOptions = currentDoctorsCache.map(doc => {
            const hoursText = `${doc.start_hour}:00 - ${doc.end_hour}:00`;
            return `<option value="${doc.id}" data-start="${doc.start_hour}" data-end="${doc.end_hour}">${escapeHtml(doc.name)} (${hoursText})</option>`;
        }).join('');
    } else {
        // Fallback: Add default doctors if cache is empty
        console.warn("No doctors in cache, using defaults");
        const defaultDocs = [
            { id: 1, name: "Dr. Sarah Johnson", start_hour: 9, end_hour: 17 },
            { id: 2, name: "Dr. Michael Chen", start_hour: 14, end_hour: 22 },
            { id: 3, name: "Dr. Emily Okonkwo", start_hour: 8, end_hour: 14 }
        ];
        docOptions = defaultDocs.map(doc => {
            const hoursText = `${doc.start_hour}:00 - ${doc.end_hour}:00`;
            return `<option value="${doc.id}" data-start="${doc.start_hour}" data-end="${doc.end_hour}">${escapeHtml(doc.name)} (${hoursText})</option>`;
        }).join('');
        // Also update the cache
        currentDoctorsCache = defaultDocs;
    }
    
    console.log("Rendering booking with doctors count:", currentDoctorsCache.length);
    
    return `
        <header class="header">
            <div class="container header-content">
                <div class="logo" onclick="window.location.hash='home'">
                    <span class="logo-icon"></span>
                    <span>SJ Hospital</span>
                </div>
                <nav class="nav">
                    <a class="nav-link" onclick="window.location.hash='home'">Home</a>
                    <a class="nav-link active" onclick="window.location.hash='book'">Book</a>
                    <a class="nav-link" onclick="window.location.hash='login'">Doctor Login</a>
                </nav>
            </div>
        </header>
        <main class="main">
            <div class="container">
                <div class="form-container">
                    <h2 class="form-title">📅 Book an Appointment</h2>
                    <p class="form-subtitle">Fill out the form below to schedule your visit</p>
                    <div id="bookingMsg" class="message hidden"></div>
                    <form id="bookingForm">
                        <div class="form-group">
                            <label>Full Name *</label>
                            <input type="text" id="patientName" required placeholder="Enter your full name">
                        </div>
                        <div class="form-group">
                            <label>Contact (Phone/Email) *</label>
                            <input type="text" id="patientContact" required placeholder="Phone number or email">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date *</label>
                                <input type="date" id="apptDate" min="${today}" required>
                            </div>
                            <div class="form-group">
                                <label>Time *</label>
                                <select id="apptTime" required>
                                    <option value="">Select time</option>
                                    ${timeOptions}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Select Doctor *</label>
                            <select id="doctorSelect" required>
                                <option value="">-- Choose a doctor --</option>
                                ${docOptions}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Confirm Booking</button>
                    </form>
                </div>
            </div>
        </main>
        <footer>
            <div class="container">
                <p>© 2025 SJ Hospital — Online booking system</p>
            </div>
        </footer>
    `;
}

function attachBookingEvents() {
    const form = document.getElementById('bookingForm');
    const msgDiv = document.getElementById('bookingMsg');
    if (!form) {
        console.error("Booking form not found");
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        msgDiv.classList.add('hidden');
        
        const patientName = document.getElementById('patientName').value.trim();
        const patientContact = document.getElementById('patientContact').value.trim();
        const apptDate = document.getElementById('apptDate').value;
        const apptTime = document.getElementById('apptTime').value;
        const doctorSelect = document.getElementById('doctorSelect');
        const doctorId = parseInt(doctorSelect.value, 10);
        const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
        const startHour = parseInt(selectedOption.dataset.start, 10);
        const endHour = parseInt(selectedOption.dataset.end, 10);
        
        if (!patientName || !patientContact || !apptDate || !apptTime || !doctorId) {
            showMessage(msgDiv, 'error', 'Please fill all fields.');
            return;
        }
        
        if (!isWithinWorkingHours(startHour, endHour, apptTime)) {
            showMessage(msgDiv, 'error', 'Selected time is outside doctor\'s working hours. Please choose another time.');
            return;
        }
        
        let appointments = getAppointments();
        const conflict = appointments.find(function(apt) {
            return apt.doctor_id === doctorId && 
                apt.appointment_date === apptDate && 
                apt.appointment_time === apptTime && 
                apt.status === 'booked';
        });
        
        if (conflict) {
            showMessage(msgDiv, 'error', 'This time slot is already taken. Please choose a different time or doctor.');
            return;
        }
        
        const newId = Date.now();
        const newAppt = {
            id: newId,
            patient_name: patientName,
            patient_contact: patientContact,
            doctor_id: doctorId,
            appointment_date: apptDate,
            appointment_time: apptTime,
            status: 'booked'
        };
        
        appointments.push(newAppt);
        saveAppointments(appointments);
        
        const doctor = currentDoctorsCache.find(function(d) { return d.id === doctorId; });
        const doctorName = doctor ? doctor.name : 'Doctor';
        showMessage(msgDiv, 'success', '✅ Appointment confirmed! ' + doctorName + ' will see you on ' + formatDate(apptDate) + ' at ' + formatTime(apptTime) + '.');
        
        form.reset();
        document.getElementById('apptDate').min = getTodayDate();
    });
}

// Login Page
function renderLogin() {
    const session = getDoctorSession();
    if (session) {
        return `
            <header class="header">
                <div class="container header-content">
                    <div class="logo" onclick="window.location.hash='home'">
                        <span class="logo-icon"></span>
                        <span>SJ Hospital</span>
                    </div>
                    <nav class="nav">
                        <a class="nav-link" onclick="window.location.hash='home'">Home</a>
                        <a class="nav-link" onclick="window.location.hash='book'">Book</a>
                        <a class="nav-link active" onclick="window.location.hash='login'">Login</a>
                    </nav>
                </div>
            </header>
            <main class="main">
                <div class="container">
                    <div class="form-container" style="text-align: center">
                        <h2 class="form-title">Already Logged In</h2>
                        <p>Welcome back, ${escapeHtml(session.name)}</p>
                        <button class="btn btn-primary" onclick="window.location.hash='dashboard'">Go to Dashboard</button>
                        <br><br>
                        <button id="forceLogoutBtn" class="btn btn-secondary">Logout</button>
                    </div>
                </div>
            </main>
            <footer><div class="container"><p>© 2025 SJ Hospital</p></div></footer>
        `;
    }
    
    // Get doctors for login dropdown
    const doctors = getDoctors();
    const doctorOptions = doctors.map(function(d) {
        return `<option value="${d.id}">${escapeHtml(d.name)}</option>`;
    }).join('');
    
    return `
        <header class="header">
            <div class="container header-content">
                <div class="logo" onclick="window.location.hash='home'">
                    <span class="logo-icon"></span>
                    <span>SJ Hospital</span>
                </div>
                <nav class="nav">
                    <a class="nav-link" onclick="window.location.hash='home'">Home</a>
                    <a class="nav-link" onclick="window.location.hash='book'">Book</a>
                    <a class="nav-link active" onclick="window.location.hash='login'">Doctor Login</a>
                </nav>
            </div>
        </header>
        <main class="main">
            <div class="container">
                <div class="form-container">
                    <h2 class="form-title">🔐 Doctor Portal</h2>
                    <p class="form-subtitle">Select your name and enter your password</p>
                    <div id="loginMsg" class="message hidden"></div>
                    <form id="loginFormDoc">
                        <div class="form-group">
                            <label>Select Doctor</label>
                            <select id="loginDoctorId" required>
                                <option value="">-- Select your name --</option>
                                ${doctorOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="loginPassword" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" >Login</button>
                    </form>
                </div>
            </div>
        </main>
        <footer><div class="container"><p>© 2025 SJ Hospital — Doctor login</p></div></footer>
    `;
}

function attachLoginEvents() {
    const form = document.getElementById('loginFormDoc');
    const forceLogout = document.getElementById('forceLogoutBtn');
    
    if (forceLogout) {
        forceLogout.addEventListener('click', function() {
            clearDoctorSession();
            window.location.hash = 'login';
        });
        return;
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const msgDiv = document.getElementById('loginMsg');
            if (msgDiv) msgDiv.classList.add('hidden');
            
            const doctorId = parseInt(document.getElementById('loginDoctorId').value, 10);
            const password = document.getElementById('loginPassword').value;
            const doctors = getDoctors();
            const doctor = doctors.find(function(d) { return d.id === doctorId; });
            
            if (!doctor || doctor.password !== password) {
                if (msgDiv) showMessage(msgDiv, 'error', 'Invalid doctor or password. Please try again.');
                return;
            }
            
            setDoctorSession({ id: doctor.id, name: doctor.name, username: doctor.username });
            window.location.hash = 'dashboard';
        });
    }
}

// Dashboard Page
function renderDashboard(session) {
    return `
        <header class="header">
            <div class="container header-content">
                <div class="logo" onclick="window.location.hash='home'">
                    <span class="logo-icon"></span>
                    <span>SJ Hospital</span>
                </div>
                <nav class="nav">
                    <a class="nav-link" onclick="window.location.hash='home'">Home</a>
                    <a class="nav-link" onclick="window.location.hash='book'">Book</a>
                    <span class="nav-link active">${escapeHtml(session.name)}</span>
                </nav>
            </div>
        </header>
        <main class="main dashboard-main">
            <div class="container">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Welcome, ${escapeHtml(session.name)}</h1>
                        <p class="dashboard-subtitle">Manage your upcoming appointments below</p>
                    </div>
                    <button id="dashboardLogoutBtn" class="btn btn-secondary">Logout</button>
                </div>
                <div id="appointmentsContainer">
                    <div class="loading">Loading appointments...</div>
                </div>
            </div>
        </main>
        <footer>
            <div class="container">
                <p>© 2025 SJ Hospital — Doctor Dashboard</p>
            </div>
        </footer>
    `;
}

function loadDoctorAppointments(doctorId) {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;
    
    const today = getTodayDate();
    let appointments = getAppointments();
    const doctorAppointments = appointments.filter(function(apt) {
        return apt.doctor_id === doctorId && 
            apt.status === 'booked' && 
            apt.appointment_date >= today;
    });
    
    doctorAppointments.sort(function(a, b) {
        if (a.appointment_date === b.appointment_date) {
            return a.appointment_time.localeCompare(b.appointment_time);
        }
        return a.appointment_date.localeCompare(b.appointment_date);
    });
    
    if (doctorAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📋 No Upcoming Appointments</h3>
                <p>You have no scheduled appointments at this time.</p>
            </div>
        `;
        return;
    }
    
    let appointmentsHtml = '<div class="appointments-list">';
    for (var i = 0; i < doctorAppointments.length; i++) {
        var apt = doctorAppointments[i];
        appointmentsHtml += `
            <div class="appointment-card" data-id="${apt.id}">
                <div class="appointment-info">
                    <div class="appointment-date-time">
                        <span class="appointment-date">${formatDate(apt.appointment_date)}</span>
                        <span class="appointment-time">${formatTime(apt.appointment_time)}</span>
                    </div>
                    <h3 class="patient-name">${escapeHtml(apt.patient_name)}</h3>
                    <p class="patient-contact">📞 ${escapeHtml(apt.patient_contact)}</p>
                </div>
                <button class="btn-done" onclick="window.markAppointmentDone(${apt.id})">✓ Mark Done</button>
            </div>
        `;
    }
    appointmentsHtml += '</div>';
    container.innerHTML = appointmentsHtml;
}

window.markAppointmentDone = function(id) {
    let appointments = getAppointments();
    for (var i = 0; i < appointments.length; i++) {
        if (appointments[i].id === id) {
            appointments[i].status = 'done';
            break;
        }
    }
    saveAppointments(appointments);
    
    const session = getDoctorSession();
    if (session) {
        loadDoctorAppointments(session.id);
    }
};

function attachDashboardLogout() {
    const logoutBtn = document.getElementById('dashboardLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            clearDoctorSession();
            window.location.hash = 'home';
        });
    }
}

// Initialize and start app
initDatabase();
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing app...");
    render();
});