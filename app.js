/* ==========================================================================
   🗽 NY TRIP - APP.JS
   ========================================================================== */

// Configuración de Supabase
const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xvstsFi5T_bbgYb-9qiJ6A_y8OrAL";

// Evita la colisión de nombres usando la variable global del navegador
if (!window.supabaseClient && window.supabase && SUPABASE_URL !== "https://TU-PROYECTO.supabase.co") {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
// Asignamos el cliente a una variable local sin volver a re-declarar 'supabase'
var supabaseApp = window.supabaseClient || null;

// ESTADO GLOBAL
const state = {
    currentUser: null,
    currentScreen: 'home',
    plans: [],
    reservations: [],
    expenses: [],
    hotel: {
        name: "Hotel Pod Times Square",
        address: "400 W 42nd St, New York, NY 10036",
        lat: 40.7580,
        lng: -73.9922,
        checkIn: "2026-12-26",
        checkOut: "2027-01-04"
    },
    flights: [
        { type: "Ida", route: "MAD → JFK", date: "26 Dic 2026", details: "Salida: 10:00 - Llegada: 12:30 (Directo)" },
        { type: "Vuelta", route: "JFK → MAD", date: "04 Ene 2027", details: "Salida: 19:30 - Llegada: 08:50 (+1 día)" }
    ],
    map: null,
    markers: [],
    activePlanFilter: 'all'
};

// CATEGORÍAS DE PLANES
const CATEGORIES = {
    rooftop: { name: "RoofTops", icon: "🌇" },
    spot: { name: "Spots", icon: "📍" },
    restaurant: { name: "Restaurantes", icon: "🍽️" },
    sweet: { name: "Dulces", icon: "🍰" },
    sightseeing: { name: "Turisteo", icon: "🗽" },
    shopping: { name: "Tiendas", icon: "🛍️" },
    other: { name: "Otros", icon: "📌" }
};

/* ==========================================================================
   INICIALIZACIÓN Y CONTROL DE AUTENTICACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupNavigation();
    setupModals();
    setupForms();
    setupFilters();

    // Relojes en directo y contador
    startClocksAndCountdown();

    // Comprobar autenticación con Supabase
    if (supabaseApp) {
        // Escuchar cambios de estado (Login / Logout)
        supabaseApp.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                handleLoginSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                showLoginScreen();
            }
        });

        // Verificar si ya hay una sesión activa
        const { data: { session } } = await supabaseApp.auth.getSession();
        if (session && session.user) {
            handleLoginSuccess(session.user);
        } else {
            showLoginScreen();
        }
    } else {
        console.error("No se pudo inicializar el cliente de Supabase.");
        showLoginScreen();
    }

    updateWeather();
    updateCurrency();
}

/* ==========================================================================
   AUTENTICACIÓN Y SESIÓN (LOGIN CONTRA BBDD)
   ========================================================================== */
function showLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const appScreen = document.getElementById("app");
    if (loginScreen) loginScreen.hidden = false;
    if (appScreen) appScreen.hidden = true;
}

function hideLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const appScreen = document.getElementById("app");
    if (loginScreen) loginScreen.hidden = true;
    if (appScreen) appScreen.hidden = false;
}

function handleLoginSuccess(user) {
    state.currentUser = user;
    const userEmailEl = document.getElementById("current-user-email");
    if (userEmailEl) {
        userEmailEl.textContent = user.email || "Viajero";
    }
    hideLoginScreen();
    loadAllData();
}

// Handler de Formulario de Login
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const emailEl = document.getElementById("login-email");
            const passwordEl = document.getElementById("login-password");
            const errorDiv = document.getElementById("login-error");

            const email = emailEl ? emailEl.value.trim() : "";
            const password = passwordEl ? passwordEl.value.trim() : "";

            if (errorDiv) {
                errorDiv.hidden = true;
                errorDiv.textContent = "";
            }

            if (!supabaseApp) {
                if (errorDiv) {
                    errorDiv.textContent = "Error de conexión con la base de datos.";
                    errorDiv.hidden = false;
                }
                return;
            }

            try {
                const { data, error } = await supabaseApp.auth.signInWithPassword({ 
                    email: email, 
                    password: password 
                });

                if (error) {
                    if (errorDiv) {
                        let msg = error.message;
                        if (msg.includes("Invalid login credentials")) {
                            msg = "Usuario o contraseña incorrectos.";
                        } else if (msg.includes("Email not confirmed")) {
                            msg = "Debes confirmar tu correo electrónico antes de entrar.";
                        }
                        errorDiv.textContent = msg;
                        errorDiv.hidden = false;
                    }
                } else if (data && data.user) {
                    handleLoginSuccess(data.user);
                }
            } catch (err) {
                console.error("Error inesperado en login:", err);
                if (errorDiv) {
                    errorDiv.textContent = "Error inesperado. Comprueba tu conexión.";
                    errorDiv.hidden = false;
                }
            }
        });
    }

    // Botón de Logout
    const logoutBtn = document.getElementById("logout-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (supabaseApp) {
                await supabaseApp.auth.signOut();
            }
            state.currentUser = null;
            showLoginScreen();
        });
    }
});

/* ==========================================================================
   RELOJES Y CONTADOR DE DÍAS
   ========================================================================== */
function startClocksAndCountdown() {
    updateClocksAndCountdown();
    setInterval(updateClocksAndCountdown, 1000);
}

function updateClocksAndCountdown() {
    const now = new Date();

    const malagaTimeStr = now.toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const nyTimeStr = now.toLocaleTimeString('es-ES', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const clocksEl = document.getElementById("header-clocks");
    if (clocksEl) {
        clocksEl.innerHTML = `
            <div class="clock-badge">🗽 <span>NY</span> <strong>${nyTimeStr}</strong></div>
            <div class="clock-badge">💃 <span>Málaga</span> <strong>${malagaTimeStr}</strong></div>
        `;
    }

    const dayEl = document.getElementById("trip-day");
    if (dayEl) {
        const startDate = new Date(2026, 11, 26);
        const endDate = new Date(2027, 0, 4);

        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diffMs = startDate - todayMidnight;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            dayEl.textContent = `Faltan ${diffDays} días`;
        } else if (diffDays <= 0 && todayMidnight <= endDate) {
            const currentDay = Math.abs(diffDays) + 1;
            dayEl.textContent = `¡Día ${currentDay} en NY! 🗽`;
        } else {
            dayEl.textContent = "Viaje Finalizado ❤️";
        }
    }
}

/* ==========================================================================
   CARGA Y SINCRONIZACIÓN DE DATOS
   ========================================================================== */
async function loadAllData() {
    updateStatus("● Sincronizando...");
    if (!supabaseApp) return;

    try {
        const [plansRes, resRes, expRes] = await Promise.all([
            supabaseApp.from("plans").select("*"),
            supabaseApp.from("reservations").select("*"),
            supabaseApp.from("expenses").select("*")
        ]);

        if (plansRes.data) state.plans = plansRes.data;
        if (resRes.data) state.reservations = resRes.data;
        if (expRes.data) state.expenses = expRes.data;

        updateStatus("● Conectado");
        renderAll();
    } catch (err) {
        console.error("Error al cargar datos:", err);
        updateStatus("⚠️ Error de Red");
    }
}

function updateStatus(text) {
    const el = document.getElementById("connection-status");
    if (el) el.textContent = text;
}

function renderAll() {
    renderNextActivity();
    renderPlans();
    renderReservations();
    renderExpenses();
    renderFlights();
    renderHotel();
    if (state.currentScreen === 'map') renderMap();
}

/* ==========================================================================
   NAVEGACIÓN DE PANTALLAS
   ========================================================================== */
function setupNavigation() {
    const buttons = document.querySelectorAll("[data-screen]");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const screen = btn.getAttribute("data-screen");
            switchScreen(screen);
        });
    });
}

function switchScreen(screenName) {
    state.currentScreen = screenName;
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));

    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) targetScreen.classList.add("active");

    const activeNav = document.querySelector(`.bottom-nav .nav-button[data-screen="${screenName}"]`);
    if (activeNav) activeNav.classList.add("active");

    if (screenName === "map") {
        setTimeout(initOrRefreshMap, 100);
    }
}

/* ==========================================================================
   GESTIÓN DE MODALES
   ========================================================================== */
function setupModals() {
    document.getElementById("open-plan-form")?.addEventListener("click", () => openPlanModal());
    document.getElementById("open-reservation-form")?.addEventListener("click", () => openModal("reservation-modal"));
    document.getElementById("open-expense-form")?.addEventListener("click", () => openModal("expense-modal"));

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.getAttribute("data-close");
            closeModal(modalId);
        });
    });
}

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

function openPlanModal(planToEdit = null) {
    const form = document.getElementById("plan-form");
    if (form) form.reset();

    if (planToEdit) {
        document.getElementById("plan-id").value = planToEdit.id;
        document.getElementById("plan-title").value = planToEdit.title || "";
        document.getElementById("plan-category").value = planToEdit.category || "other";
        document.getElementById("plan-description").value = planToEdit.description || "";
        document.getElementById("plan-date").value = planToEdit.date || ""; 
        document.getElementById("plan-time").value = planToEdit.time || "";
        document.getElementById("plan-location").value = planToEdit.location || "";
    } else {
        const idInput = document.getElementById("plan-id");
        if (idInput) idInput.value = "";
    }

    openModal("plan-modal");
}

/* ==========================================================================
   FORMULARIO DE DATOS
   ========================================================================== */
function setupForms() {
    document.getElementById("plan-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const id = document.getElementById("plan-id").value;
        const dateValue = document.getElementById("plan-date").value;

        const planData = {
            title: document.getElementById("plan-title").value,
            category: document.getElementById("plan-category").value,
            description: document.getElementById("plan-description").value,
            date: dateValue ? dateValue : null,
            time: document.getElementById("plan-time").value || null,
            location: document.getElementById("plan-location").value || null
        };

        if (id) {
            if (supabaseApp) await supabaseApp.from("plans").update(planData).eq("id", id);
        } else {
            if (supabaseApp) {
                const { data } = await supabaseApp.from("plans").insert([planData]).select();
                if (data) state.plans.push(data[0]);
            }
        }

        closeModal("plan-modal");
        loadAllData();
    });

    document.getElementById("reservation-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const resData = {
            type: document.getElementById("reservation-type").value,
            title: document.getElementById("reservation-title").value,
            description: document.getElementById("reservation-description").value,
            date: document.getElementById("reservation-date").value || null,
            time: document.getElementById("reservation-time").value || null,
            location: document.getElementById("reservation-location").value || null
        };

        if (supabaseApp) await supabaseApp.from("reservations").insert([resData]);

        closeModal("reservation-modal");
        loadAllData();
    });

    document.getElementById("expense-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const participants = Array.from(document.querySelectorAll("input[name='participant']:checked")).map(cb => cb.value);
        
        const expData = {
            title: document.getElementById("expense-title").value,
            amount: parseFloat(document.getElementById("expense-amount").value),
            currency: document.getElementById("expense-currency").value,
            paid_by: document.getElementById("expense-paid-by").value,
            participants: participants,
            date: document.getElementById("expense-date").value || new Date().toISOString().split("T")[0]
        };

        if (supabaseApp) await supabaseApp.from("expenses").insert([expData]);

        closeModal("expense-modal");
        loadAllData();
    });
}

/* ==========================================================================
   RENDERIZADO DE SECCIONES
   ========================================================================== */
function renderPlans() {
    const listEl = document.getElementById("plan-list");
    if (!listEl) return;

    let filtered = state.plans;
    if (state.activePlanFilter !== 'all') {
        filtered = filtered.filter(p => p.category === state.activePlanFilter);
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No hay planes en esta categoría.</div>`;
        return;
    }

    filtered.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    listEl.innerHTML = filtered.map(plan => {
        const cat = CATEGORIES[plan.category] || CATEGORIES.other;
        
        let dateText = "📌 Por definir";
        if (plan.date) {
            const dateObj = new Date(plan.date + "T00:00:00");
            dateText = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        }

        const timeText = plan.time ? ` ⏰ ${plan.time}` : "";

        return `
            <div class="card plan-card">
                <div class="card-header">
                    <span class="badge-category">${cat.icon} ${cat.name}</span>
                    <span class="badge-date ${!plan.date ? 'no-date' : ''}">${dateText}${timeText}</span>
                </div>
                <h3>${plan.title}</h3>
                ${plan.description ? `<p>${plan.description}</p>` : ''}
                ${plan.location ? `<small>📍 ${plan.location}</small>` : ''}
                <div class="card-actions">
                    <button class="icon-button" onclick="editPlan('${plan.id}')" title="Editar">✏️ Editar</button>
                    <button class="icon-button danger" onclick="deletePlan('${plan.id}')" title="Eliminar">🗑️ Borrar</button>
                </div>
            </div>
        `;
    }).join("");
}

window.editPlan = function(id) {
    const plan = state.plans.find(p => p.id == id);
    if (plan) openPlanModal(plan);
};

window.deletePlan = async function(id) {
    if (!confirm("¿Seguro que deseas eliminar este plan?")) return;

    if (supabaseApp) {
        await supabaseApp.from("plans").delete().eq("id", id);
    }
    loadAllData();
};

function setupFilters() {
    const filterBtns = document.querySelectorAll(".plan-filter");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.activePlanFilter = btn.getAttribute("data-plan-filter");
            renderPlans();
        });
    });
}

function renderNextActivity() {
    const nextEl = document.getElementById("next-activity");
    if (!nextEl) return;

    const today = new Date().toISOString().split("T")[0];
    const upcoming = state.plans
        .filter(p => p.date && p.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length > 0) {
        const next = upcoming[0];
        const dateObj = new Date(next.date + "T00:00:00");
        const dateText = dateObj.toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short' });

        nextEl.innerHTML = `
            <span>📅</span>
            <div>
                <strong>${next.title}</strong>
                <p>${dateText} ${next.time ? 'a las ' + next.time : ''} — ${next.location || 'Nueva York'}</p>
            </div>
        `;
    } else {
        nextEl.innerHTML = `
            <span>🗽</span>
            <div>
                <strong>¡Sin planes próximos!</strong>
                <p>Añade actividades o explora la lista de ideas.</p>
            </div>
        `;
    }
}

/* ==========================================================================
   TIEMPO Y DIVISAS
   ========================================================================== */
async function updateWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7143&longitude=-74.006&current_weather=true");
        const data = await res.json();
        if (data.current_weather) {
            document.getElementById("weather-temperature").textContent = `${Math.round(data.current_weather.temperature)}°C`;
            document.getElementById("weather-description").textContent = "Nueva York";
            document.getElementById("weather-wind").textContent = `Viento: ${Math.round(data.current_weather.windspeed)} km/h`;
            document.getElementById("weather-update").textContent = "Actualizado";
        }
    } catch (e) {
        console.warn("Error obteniendo tiempo:", e);
    }
}

async function updateCurrency() {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/EUR");
        const data = await res.json();
        if (data && data.rates && data.rates.USD) {
            const rate = data.rates.USD.toFixed(2);
            document.getElementById("currency-value").textContent = `1 € = ${rate} $`;
            document.getElementById("currency-update").textContent = "Tiempo real";
        }
    } catch (e) {
        console.warn("Error obteniendo divisas:", e);
    }
}

/* ==========================================================================
   RESERVAS, GASTOS, VUELOS Y HOTEL
   ========================================================================== */
function renderReservations() {
    const listEl = document.getElementById("reservation-list");
    if (!listEl) return;

    if (state.reservations.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No hay reservas registradas.</div>`;
        return;
    }

    listEl.innerHTML = state.reservations.map(r => `
        <div class="card">
            <h3>📋 ${r.title}</h3>
            ${r.description ? `<p>${r.description}</p>` : ''}
            <small>${r.date || 'Sin fecha'} ${r.time || ''} ${r.location ? '— ' + r.location : ''}</small>
        </div>
    `).join("");
}

function renderExpenses() {
    const listEl = document.getElementById("expense-list");
    const summaryEl = document.getElementById("expense-summary");
    if (!listEl) return;

    if (state.expenses.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No hay gastos registrados.</div>`;
        if (summaryEl) summaryEl.innerHTML = "";
        return;
    }

    let totalUSD = 0;
    state.expenses.forEach(e => {
        totalUSD += e.currency === 'EUR' ? e.amount * 1.08 : e.amount;
    });

    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="info-card">
                <strong>Gasto Total Aprox:</strong> $${totalUSD.toFixed(2)} USD
                <small>(${state.expenses.length} pagos realizados)</small>
            </div>
        `;
    }

    listEl.innerHTML = state.expenses.map(e => `
        <div class="card">
            <div class="card-header">
                <strong>${e.title}</strong>
                <span class="badge-amount">${e.amount} ${e.currency}</span>
            </div>
            <p>Pagó: <strong>${e.paid_by}</strong></p>
            <small>Para: ${e.participants ? e.participants.join(", ") : "Todos"}</small>
        </div>
    `).join("");
}

function renderFlights() {
    const listEl = document.getElementById("flight-list");
    if (!listEl) return;

    listEl.innerHTML = state.flights.map(f => `
        <div class="card">
            <h3>✈️ Vuelo de ${f.type}</h3>
            <strong>${f.route}</strong>
            <p>📅 ${f.date}</p>
            <small>${f.details}</small>
        </div>
    `).join("");
}

function renderHotel() {
    const container = document.getElementById("hotel-container");
    if (!container) return;

    const h = state.hotel;
    container.innerHTML = `
        <div class="card hotel-card">
            <h3>🏨 ${h.name}</h3>
            <p>📍 ${h.address}</p>
            <small>📅 Entrada: ${h.checkIn} | Salida: ${h.checkOut}</small>
        </div>
    `;
}

/* ==========================================================================
   MAPA LEAFLET
   ========================================================================== */
function initOrRefreshMap() {
    if (typeof L === 'undefined') return;
    
    if (!state.map) {
        state.map = L.map("map").setView([40.7580, -73.9855], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(state.map);
    }
    renderMap();
}

function renderMap() {
    if (!state.map) return;

    state.markers.forEach(m => state.map.removeLayer(m));
    state.markers = [];

    const hotelMarker = L.marker([state.hotel.lat, state.hotel.lng])
        .addTo(state.map)
        .bindPopup(`<b>🏨 ${state.hotel.name}</b><br>${state.hotel.address}`);
    state.markers.push(hotelMarker);
}
