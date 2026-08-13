/* ==========================================================================
   🗽 NY TRIP - APP.JS
   ========================================================================== */

// Configuración de Supabase[cite: 5]
const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";[cite: 5]
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YnJuYnlvc3J0eGVheXFtdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUwODQsImV4cCI6MjEwMjAzMTA4NH0.W3mCe1yAehFd0bz_XNVJ83YR-dNz-8VZnnhgj-cQEss";[cite: 5]

// Inicialización de Supabase[cite: 5]
var supabaseApp = null;[cite: 5]
if (window.supabase) {[cite: 5]
    supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);[cite: 5]
}

// ESTADO GLOBAL[cite: 5]
const state = {[cite: 5]
    currentUser: null,[cite: 5]
    currentScreen: 'home',[cite: 5]
    plans: [],[cite: 5]
    reservations: [],[cite: 5]
    expenses: [],[cite: 5]
    hotel: {[cite: 5]
        name: "Courtyard by Marriott New York Manhattan/Upper East Side",[cite: 5]
        address: "410 East 92nd Street, Upper East Side, New York, NY 10128",[cite: 5]
        lat: 40.7797,[cite: 5]
        lng: -73.9472,[cite: 5]
        checkIn: "26 Dic 2026 (15:00)",[cite: 5]
        checkOut: "04 Ene 2027 (12:00)"[cite: 5]
    },
    flights: [[cite: 5]
        { type: "Ida", route: "MAD → JFK", date: "26 Dic 2026", details: "Salida: 10:00 - Llegada: 12:30 (Directo)" },[cite: 5]
        { type: "Vuelta", route: "JFK → MAD", date: "04 Ene 2027", details: "Salida: 19:30 - Llegada: 08:50 (+1 día)" }[cite: 5]
    ],
    map: null,[cite: 5]
    markers: [],[cite: 5]
    activePlanFilter: 'all'[cite: 5]
};

// MAPEO UNIFICADO Y FLEXIBLE DE CATEGORÍAS[cite: 5]
const CATEGORIES = {[cite: 5]
    food: { name: "Restaurantes", icon: "🍽️" },[cite: 5]
    restaurant: { name: "Restaurantes", icon: "🍽️" },[cite: 5]
    restaurantes: { name: "Restaurantes", icon: "🍽️" },[cite: 5]
    
    sweet: { name: "Dulces", icon: "🍪" },[cite: 5]
    dulces: { name: "Dulces", icon: "🍪" },[cite: 5]
    dulce: { name: "Dulces", icon: "🍪" },[cite: 5]
    
    activity: { name: "Spots", icon: "📍" },[cite: 5]
    spot: { name: "Spots", icon: "📍" },[cite: 5]
    spots: { name: "Spots", icon: "📍" },[cite: 5]
    
    shopping: { name: "Tiendas", icon: "🛍️" },[cite: 5]
    tiendas: { name: "Tiendas", icon: "🛍️" },[cite: 5]
    
    sightseeing: { name: "Turisteo", icon: "🗽" },[cite: 5]
    turisteo: { name: "Turisteo", icon: "🗽" },[cite: 5]
    
    other: { name: "Otros", icon: "📌" },[cite: 5]
    otros: { name: "Otros", icon: "📌" }[cite: 5]
};

function getCategoryIcon(category) {[cite: 5]
    if (!category) return "📌";[cite: 5]
    const key = category.toString().trim().toLowerCase();[cite: 5]
    return CATEGORIES[key] ? CATEGORIES[key].icon : "📌";[cite: 5]
}

/* ==========================================================================
   INICIALIZACIÓN[cite: 5]
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {[cite: 5]
    initApp();[cite: 5]
});

async function initApp() {[cite: 5]
    setupNavigation();[cite: 5]
    setupModals();[cite: 5]
    setupForms();[cite: 5]
    setupFilters();[cite: 5]
    setupLocationSearch();[cite: 5]

    startClocksAndCountdown();[cite: 5]

    if (supabaseApp) {[cite: 5]
        supabaseApp.auth.onAuthStateChange((event, session) => {[cite: 5]
            if (session && session.user) {[cite: 5]
                handleLoginSuccess(session.user);[cite: 5]
            } else if (event === 'SIGNED_OUT') {[cite: 5]
                showLoginScreen();[cite: 5]
            }
        });

        const { data: { session } } = await supabaseApp.auth.getSession();[cite: 5]
        if (session && session.user) {[cite: 5]
            handleLoginSuccess(session.user);[cite: 5]
        } else {
            showLoginScreen();[cite: 5]
        }
    } else {
        console.error("No se pudo inicializar el cliente de Supabase.");[cite: 5]
        showLoginScreen();[cite: 5]
    }

    updateWeather();[cite: 5]
    updateCurrency();[cite: 5]
}

/* ==========================================================================
   AUTENTICACIÓN[cite: 5]
   ========================================================================== */
function showLoginScreen() {[cite: 5]
    const loginScreen = document.getElementById("login-screen");[cite: 5]
    const appScreen = document.getElementById("app");[cite: 5]
    if (loginScreen) loginScreen.hidden = false;[cite: 5]
    if (appScreen) appScreen.hidden = true;[cite: 5]
}

function hideLoginScreen() {[cite: 5]
    const loginScreen = document.getElementById("login-screen");[cite: 5]
    const appScreen = document.getElementById("app");[cite: 5]
    if (loginScreen) loginScreen.hidden = true;[cite: 5]
    if (appScreen) appScreen.hidden = false;[cite: 5]
}

function handleLoginSuccess(user) {[cite: 5]
    state.currentUser = user;[cite: 5]
    const userEmailEl = document.getElementById("current-user-email");[cite: 5]
    if (userEmailEl) {[cite: 5]
        userEmailEl.textContent = user.email || "Viajero";[cite: 5]
    }
    hideLoginScreen();[cite: 5]
    loadAllData();[cite: 5]
}

document.addEventListener("DOMContentLoaded", () => {[cite: 5]
    const loginForm = document.getElementById("login-form");[cite: 5]
    if (loginForm) {[cite: 5]
        loginForm.addEventListener("submit", async (e) => {[cite: 5]
            e.preventDefault();[cite: 5]
            
            const emailEl = document.getElementById("login-email");[cite: 5]
            const passwordEl = document.getElementById("login-password");[cite: 5]
            const errorDiv = document.getElementById("login-error");[cite: 5]

            const email = emailEl ? emailEl.value.trim() : "";[cite: 5]
            const password = passwordEl ? passwordEl.value.trim() : "";[cite: 5]

            if (errorDiv) {[cite: 5]
                errorDiv.hidden = true;[cite: 5]
                errorDiv.textContent = "";[cite: 5]
            }

            if (!supabaseApp) {[cite: 5]
                if (errorDiv) {[cite: 5]
                    errorDiv.textContent = "Error de conexión con Supabase.";[cite: 5]
                    errorDiv.hidden = false;[cite: 5]
                }
                return;[cite: 5]
            }

            try {[cite: 5]
                const { data, error } = await supabaseApp.auth.signInWithPassword({ email, password });[cite: 5]

                if (error) {[cite: 5]
                    if (errorDiv) {[cite: 5]
                        let msg = error.message;[cite: 5]
                        if (msg.includes("Invalid login credentials")) msg = "Usuario o contraseña incorrectos.";[cite: 5]
                        errorDiv.textContent = msg;[cite: 5]
                        errorDiv.hidden = false;[cite: 5]
                    }
                } else if (data && data.user) {[cite: 5]
                    handleLoginSuccess(data.user);[cite: 5]
                }
            } catch (err) {[cite: 5]
                console.error("Error en login:", err);[cite: 5]
            }
        });
    }

    const logoutBtn = document.getElementById("logout-button");[cite: 5]
    if (logoutBtn) {[cite: 5]
        logoutBtn.addEventListener("click", async () => {[cite: 5]
            if (supabaseApp) await supabaseApp.auth.signOut();[cite: 5]
            state.currentUser = null;[cite: 5]
            showLoginScreen();[cite: 5]
        });
    }
});

/* ==========================================================================
   RELOJES Y CONTADOR[cite: 5]
   ========================================================================== */
function startClocksAndCountdown() {[cite: 5]
    updateClocksAndCountdown();[cite: 5]
    setInterval(updateClocksAndCountdown, 1000);[cite: 5]
}

function updateClocksAndCountdown() {[cite: 5]
    const now = new Date();[cite: 5]

    const malagaTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });[cite: 5]
    const nyTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });[cite: 5]

    const clocksEl = document.getElementById("header-clocks");[cite: 5]
    if (clocksEl) {[cite: 5]
        clocksEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-weight: 600;">
                <span>🗽 NY</span> <strong>${nyTimeStr}</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; opacity: 0.85; font-weight: 500;">
                <span>💃 Málaga</span> <strong>${malagaTimeStr}</strong>
            </div>
        `;[cite: 5]
    }

    const dayEl = document.getElementById("trip-day");[cite: 5]
    if (dayEl) {[cite: 5]
        const startDate = new Date(2026, 11, 26);[cite: 5]
        const endDate = new Date(2027, 0, 4);[cite: 5]
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());[cite: 5]
        const diffDays = Math.round((startDate - todayMidnight) / (1000 * 60 * 60 * 24));[cite: 5]

        if (diffDays > 0) {[cite: 5]
            dayEl.textContent = `Faltan ${diffDays} días`;[cite: 5]
        } else if (diffDays <= 0 && todayMidnight <= endDate) {[cite: 5]
            dayEl.textContent = `¡Día ${Math.abs(diffDays) + 1} en NY! 🗽`;[cite: 5]
        } else {
            dayEl.textContent = "Viaje Finalizado ❤️";[cite: 5]
        }
    }
}

/* ==========================================================================
   BÚSQUEDA Y GEOCODIFICACIÓN (PHOTON)[cite: 5]
   ========================================================================== */
function setupLocationSearch() {[cite: 5]
    initPhotonAutocomplete("plan-location", "plan-location-results");[cite: 5]
    initPhotonAutocomplete("reservation-location", "reservation-location-results");[cite: 5]
}

function initPhotonAutocomplete(inputId, resultsContainerId) {[cite: 5]
    const input = document.getElementById(inputId);[cite: 5]
    if (!input) return;[cite: 5]

    let container = document.getElementById(resultsContainerId);[cite: 5]
    if (!container) {[cite: 5]
        container = document.createElement("div");[cite: 5]
        container.id = resultsContainerId;[cite: 5]
        container.className = "search-results-dropdown";[cite: 5]
        input.parentNode.style.position = "relative";[cite: 5]
        input.parentNode.appendChild(container);[cite: 5]
    }

    let timeout = null;[cite: 5]

    input.addEventListener("input", () => {[cite: 5]
        clearTimeout(timeout);[cite: 5]
        delete input.dataset.lat;[cite: 5]
        delete input.dataset.lng;[cite: 5]

        const query = input.value.trim();[cite: 5]
        if (query.length < 2) {[cite: 5]
            container.innerHTML = "";[cite: 5]
            return;[cite: 5]
        }

        timeout = setTimeout(async () => {[cite: 5]
            try {[cite: 5]
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=40.7128&lon=-73.9352&limit=5`;[cite: 5]
                const res = await fetch(url);[cite: 5]
                const data = await res.json();[cite: 5]

                container.innerHTML = "";[cite: 5]

                if (!data.features || data.features.length === 0) {[cite: 5]
                    container.innerHTML = `<div style="padding: 10px; color: var(--muted); font-size: 13px;">Sin resultados encontrados</div>`;[cite: 5]
                    return;[cite: 5]
                }

                data.features.forEach(feature => {[cite: 5]
                    const props = feature.properties;[cite: 5]
                    const coords = feature.geometry.coordinates; // [lon, lat][cite: 5]
                    const name = props.name || query;[cite: 5]
                    const city = props.city || props.state || "New York";[cite: 5]
                    const fullAddress = `${props.street ? props.street + ', ' : ''}${city}`;[cite: 5]

                    const item = document.createElement("div");[cite: 5]
                    item.className = "search-result-item";[cite: 5]
                    item.innerHTML = `
                        <strong style="display: block; font-size: 14px;">📍 ${escapeHTML(name)}</strong>
                        <span style="font-size: 11px; color: var(--muted); display: block;">${escapeHTML(fullAddress)}</span>
                    `;[cite: 5]

                    item.addEventListener("click", () => {[cite: 5]
                        selectSearchLocation(name, inputId, resultsContainerId, coords[1], coords[0]);[cite: 5]
                    });

                    container.appendChild(item);[cite: 5]
                });
            } catch (err) {[cite: 5]
                console.error("Error en autocompletado Photon:", err);[cite: 5]
            }
        }, 250);
    });

    document.addEventListener("click", (e) => {[cite: 5]
        if (e.target !== input && !container.contains(e.target)) {[cite: 5]
            container.innerHTML = "";[cite: 5]
        }
    });
}

function selectSearchLocation(name, inputId, resultsContainerId, lat, lon) {[cite: 5]
    const input = document.getElementById(inputId);[cite: 5]
    if (input) {[cite: 5]
        input.value = name;[cite: 5]
        input.dataset.lat = lat;[cite: 5]
        input.dataset.lng = lon;[cite: 5]
    }
    const container = document.getElementById(resultsContainerId);[cite: 5]
    if (container) container.innerHTML = "";[cite: 5]
}

async function geocodeAddress(query) {[cite: 5]
    try {[cite: 5]
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=40.7128&lon=-73.9352&limit=1`;[cite: 5]
        const res = await fetch(url);[cite: 5]
        const data = await res.json();[cite: 5]
        if (data && data.features && data.features.length > 0) {[cite: 5]
            const coords = data.features[0].geometry.coordinates;[cite: 5]
            return { lat: coords[1], lng: coords[0] };[cite: 5]
        }
    } catch (e) {[cite: 5]
        console.warn("No se pudo geocodificar:", query, e);[cite: 5]
    }
    return { lat: 40.7128, lng: -74.0060 };[cite: 5]
}

function escapeHTML(str) {[cite: 5]
    if (!str) return "";[cite: 5]
    return String(str)[cite: 5]
        .replace(/&/g, "&amp;")[cite: 5]
        .replace(/</g, "&lt;")[cite: 5]
        .replace(/>/g, "&gt;")[cite: 5]
        .replace(/"/g, "&quot;")[cite: 5]
        .replace(/'/g, "&#039;");[cite: 5]
}

/* ==========================================================================
   CARGA Y SINCRONIZACIÓN DE DATOS[cite: 5]
   ========================================================================== */
async function loadAllData() {[cite: 5]
    updateStatus("● Sincronizando...");[cite: 5]
    if (!supabaseApp) return;[cite: 5]

    try {[cite: 5]
        const [plansRes, resRes, expRes] = await Promise.all([[cite: 5]
            supabaseApp.from("plans").select("*"),[cite: 5]
            supabaseApp.from("reservations").select("*"),[cite: 5]
            supabaseApp.from("expenses").select("*")[cite: 5]
        ]);

        if (plansRes.error) console.error("Error cargando planes:", plansRes.error);[cite: 5]
        if (plansRes.data) state.plans = plansRes.data;[cite: 5]

        if (resRes.data) state.reservations = resRes.data;[cite: 5]
        if (expRes.data) state.expenses = expRes.data;[cite: 5]

        updateStatus("● Conectado");[cite: 5]
        renderAll();[cite: 5]
    } catch (err) {[cite: 5]
        console.error("Error al cargar datos:", err);[cite: 5]
        updateStatus("⚠️ Error de Red");[cite: 5]
    }
}

function updateStatus(text) {[cite: 5]
    const el = document.getElementById("connection-status");[cite: 5]
    if (el) el.textContent = text;[cite: 5]
}

function renderAll() {[cite: 5]
    renderNextActivity();[cite: 5]
    renderPlans();[cite: 5]
    renderReservations();[cite: 5]
    renderExpenses();[cite: 5]
    renderFlights();[cite: 5]
    renderHotel();[cite: 5]
    if (state.currentScreen === 'map') renderMap();[cite: 5]
}

/* ==========================================================================
   NAVEGACIÓN DE PANTALLAS[cite: 5]
   ========================================================================== */
function setupNavigation() {[cite: 5]
    const buttons = document.querySelectorAll("[data-screen]");[cite: 5]
    buttons.forEach(btn => {[cite: 5]
        btn.addEventListener("click", () => {[cite: 5]
            const screen = btn.getAttribute("data-screen");[cite: 5]
            switchScreen(screen);[cite: 5]
        });
    });
}

function switchScreen(screenName) {[cite: 5]
    state.currentScreen = screenName;[cite: 5]
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));[cite: 5]
    document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));[cite: 5]

    const targetScreen = document.getElementById(`screen-${screenName}`);[cite: 5]
    if (targetScreen) targetScreen.classList.add("active");[cite: 5]

    const activeNav = document.querySelector(`.bottom-nav .nav-button[data-screen="${screenName}"]`);[cite: 5]
    if (activeNav) activeNav.classList.add("active");[cite: 5]

    if (screenName === "map") {[cite: 5]
        setTimeout(initOrRefreshMap, 150);[cite: 5]
    }
}

/* ==========================================================================
   GESTIÓN DE MODALES[cite: 5]
   ========================================================================== */
function setupModals() {[cite: 5]
    document.getElementById("open-plan-form")?.addEventListener("click", () => openPlanModal());[cite: 5]
    document.getElementById("open-reservation-form")?.addEventListener("click", () => openModal("reservation-modal"));[cite: 5]
    document.getElementById("open-expense-form")?.addEventListener("click", () => openModal("expense-modal"));[cite: 5]

    document.querySelectorAll("[data-close]").forEach(btn => {[cite: 5]
        btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));[cite: 5]
    });
}

function openModal(id) {[cite: 5]
    document.getElementById(id)?.classList.remove("hidden");[cite: 5]
}

function closeModal(id) {[cite: 5]
    document.getElementById(id)?.classList.add("hidden");[cite: 5]
}

function openPlanModal(planToEdit = null) {[cite: 5]
    const form = document.getElementById("plan-form");[cite: 5]
    if (form) form.reset();[cite: 5]

    const resultsContainer = document.getElementById("plan-location-results");[cite: 5]
    if (resultsContainer) resultsContainer.innerHTML = "";[cite: 5]

    const locInput = document.getElementById("plan-location");[cite: 5]

    if (planToEdit) {[cite: 5]
        document.getElementById("plan-id").value = planToEdit.id;[cite: 5]
        document.getElementById("plan-title").value = planToEdit.title || "";[cite: 5]
        document.getElementById("plan-category").value = planToEdit.category || "other";[cite: 5]
        document.getElementById("plan-description").value = planToEdit.description || "";[cite: 5]
        document.getElementById("plan-date").value = planToEdit.date || "";[cite: 5]
        document.getElementById("plan-time").value = planToEdit.time || "";[cite: 5]
        
        if (locInput) {[cite: 5]
            locInput.value = planToEdit.location_name || "";[cite: 5]
            locInput.dataset.lat = planToEdit.latitude || "";[cite: 5]
            locInput.dataset.lng = planToEdit.longitude || "";[cite: 5]
        }
    } else {
        const idInput = document.getElementById("plan-id");[cite: 5]
        if (idInput) idInput.value = "";[cite: 5]
        if (locInput) {[cite: 5]
            delete locInput.dataset.lat;[cite: 5]
            delete locInput.dataset.lng;[cite: 5]
        }
    }

    openModal("plan-modal");[cite: 5]
}

/* ==========================================================================
   FORMULARIO DE PLANES[cite: 5]
   ========================================================================== */
function setupForms() {[cite: 5]
    document.getElementById("plan-form")?.addEventListener("submit", async (e) => {[cite: 5]
        e.preventDefault();[cite: 5]
        
        const submitBtn = e.target.querySelector('button[type="submit"]');[cite: 5]
        if (submitBtn) {[cite: 5]
            submitBtn.disabled = true;[cite: 5]
            submitBtn.textContent = "Guardando...";[cite: 5]
        }

        try {[cite: 5]
            const id = document.getElementById("plan-id").value;[cite: 5]
            const titleVal = document.getElementById("plan-title").value.trim();[cite: 5]
            const dateVal = document.getElementById("plan-date").value;[cite: 5]
            const locInput = document.getElementById("plan-location");[cite: 5]
            const locationText = locInput ? locInput.value.trim() : "";[cite: 5]

            if (!titleVal) {[cite: 5]
                alert("Por favor introduce un título para el plan.");[cite: 5]
                return;[cite: 5]
            }

            let lat = locInput && locInput.dataset.lat ? parseFloat(locInput.dataset.lat) : null;[cite: 5]
            let lng = locInput && locInput.dataset.lng ? parseFloat(locInput.dataset.lng) : null;[cite: 5]

            if (locationText && (!lat || !lng)) {[cite: 5]
                const coords = await geocodeAddress(locationText);[cite: 5]
                if (coords) {[cite: 5]
                    lat = coords.lat;[cite: 5]
                    lng = coords.lng;[cite: 5]
                }
            }

            const CATEGORY_TO_DB = {[cite: 5]
                food: "Restaurantes",[cite: 5]
                sweet: "Dulces",[cite: 5]
                activity: "Spots",[cite: 5]
                shopping: "Tiendas",[cite: 5]
                sightseeing: "Turisteo",[cite: 5]
                other: "Otros"[cite: 5]
            };

            const rawCategory = document.getElementById("plan-category").value || "other";[cite: 5]
            const dbCategory = CATEGORY_TO_DB[rawCategory] || rawCategory;[cite: 5]

            const planData = {[cite: 5]
                title: titleVal,[cite: 5]
                category: dbCategory,[cite: 5]
                description: document.getElementById("plan-description").value || null,[cite: 5]
                date: dateVal ? dateVal : null,[cite: 5]
                time: document.getElementById("plan-time").value || null,[cite: 5]
                location_name: locationText || null,[cite: 5]
                latitude: lat,[cite: 5]
                longitude: lng,[cite: 5]
                created_by: state.currentUser ? (state.currentUser.email || state.currentUser.id) : "invitado"[cite: 5]
            };

            if (!supabaseApp) throw new Error("No hay conexión con Supabase.");[cite: 5]

            let result;[cite: 5]
            if (id) {[cite: 5]
                result = await supabaseApp.from("plans").update(planData).eq("id", id);[cite: 5]
            } else {
                result = await supabaseApp.from("plans").insert([planData]);[cite: 5]
            }

            if (result.error) {[cite: 5]
                throw new Error(result.error.message);[cite: 5]
            }

            closeModal("plan-modal");[cite: 5]
            await loadAllData();[cite: 5]

        } catch (err) {[cite: 5]
            console.error("Error al guardar plan:", err);[cite: 5]
            alert("⚠️ No se pudo guardar el plan: " + err.message);[cite: 5]
        } finally {
            if (submitBtn) {[cite: 5]
                submitBtn.disabled = false;[cite: 5]
                submitBtn.textContent = "Guardar Plan";[cite: 5]
            }
        }
    });

    document.getElementById("reservation-form")?.addEventListener("submit", async (e) => {[cite: 5]
        e.preventDefault();[cite: 5]
        const resData = {[cite: 5]
            type: document.getElementById("reservation-type").value,[cite: 5]
            title: document.getElementById("reservation-title").value,[cite: 5]
            description: document.getElementById("reservation-description").value,[cite: 5]
            date: document.getElementById("reservation-date").value || null,[cite: 5]
            time: document.getElementById("reservation-time").value || null,[cite: 5]
            location: document.getElementById("reservation-location").value || null[cite: 5]
        };

        if (supabaseApp) await supabaseApp.from("reservations").insert([resData]);[cite: 5]

        closeModal("reservation-modal");[cite: 5]
        loadAllData();[cite: 5]
    });

    document.getElementById("expense-form")?.addEventListener("submit", async (e) => {[cite: 5]
        e.preventDefault();[cite: 5]
        
        const expData = {[cite: 5]
            title: document.getElementById("expense-title").value,[cite: 5]
            amount: parseFloat(document.getElementById("expense-amount").value),[cite: 5]
            currency: document.getElementById("expense-currency").value,[cite: 5]
            paid_by: document.getElementById("expense-paid-by").value,[cite: 5]
            date: document.getElementById("expense-date").value || new Date().toISOString().split("T")[0][cite: 5]
        };

        if (supabaseApp) await supabaseApp.from("expenses").insert([expData]);[cite: 5]

        closeModal("expense-modal");[cite: 5]
        loadAllData();[cite: 5]
    });
}

/* ==========================================================================
   RENDERIZADO DE VISTAS DE PLANES CON CHECK COMPLETADO Y FILTROS[cite: 5]
   ========================================================================== */
function renderPlans() {[cite: 5]
    const listEl = document.getElementById("plan-list");[cite: 5]
    if (!listEl) return;[cite: 5]

    let filtered = state.plans;[cite: 5]

    if (state.activePlanFilter !== 'all') {[cite: 5]
        filtered = filtered.filter(p => {[cite: 5]
            if (!p.category) return state.activePlanFilter === 'other';[cite: 5]
            
            const cat = p.category.toString().trim().toLowerCase();[cite: 5]
            const filter = state.activePlanFilter.toLowerCase();[cite: 5]

            if (filter === 'food') return cat === 'food' || cat === 'restaurant' || cat === 'restaurantes';[cite: 5]
            if (filter === 'sweet') return cat === 'sweet' || cat === 'dulce' || cat === 'dulces';[cite: 5]
            if (filter === 'activity') return cat === 'activity' || cat === 'spot' || cat === 'spots';[cite: 5]
            if (filter === 'shopping') return cat === 'shopping' || cat === 'tiendas';[cite: 5]
            if (filter === 'sightseeing') return cat === 'sightseeing' || cat === 'turisteo' || cat === 'nightlife';[cite: 5]
            if (filter === 'other') return cat === 'other' || cat === 'otros';[cite: 5]

            return cat === filter;[cite: 5]
        });
    }

    if (!filtered || filtered.length === 0) {[cite: 5]
        listEl.innerHTML = `<div class="empty-state" style="padding: 20px; text-align: center; color: var(--muted);">No hay planes registrados en esta categoría.</div>`;[cite: 5]
        return;[cite: 5]
    }

    filtered.sort((a, b) => {[cite: 5]
        const aDone = a.completed ? 1 : 0;[cite: 5]
        const bDone = b.completed ? 1 : 0;[cite: 5]

        if (aDone !== bDone) {[cite: 5]
            return aDone - bDone;[cite: 5]
        }

        if (!a.date) return 1;[cite: 5]
        if (!b.date) return -1;[cite: 5]
        return new Date(a.date) - new Date(b.date);[cite: 5]
    });

    listEl.innerHTML = filtered.map(plan => {[cite: 5]
        const catKey = plan.category ? plan.category.toString().trim().toLowerCase() : 'other';[cite: 5]
        const cat = CATEGORIES[catKey] || CATEGORIES.other;[cite: 5]
        const isDone = !!plan.completed;[cite: 5]

        let dateText = "Por definir";[cite: 5]
        if (plan.date) {[cite: 5]
            const dateObj = new Date(plan.date + "T00:00:00");[cite: 5]
            dateText = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" });[cite: 5]
        }

        const timeText = plan.time ? ` ⏰ ${plan.time}` : "";[cite: 5]

        return `
            <div class="card plan-card ${isDone ? 'is-completed' : ''}">
                <div class="card-actions">
                    <button class="icon-button" onclick="editPlan('${plan.id}')" title="Editar">✏️</button>
                    <button class="icon-button danger" onclick="deletePlan('${plan.id}')" title="Borrar">🗑️</button>
                </div>

                <div class="plan-checkbox-wrapper" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <input 
                        type="checkbox" 
                        class="plan-checkbox" 
                        id="check-${plan.id}" 
                        ${isDone ? 'checked' : ''} 
                        onchange="togglePlanCompleted('${plan.id}', this.checked)"
                        style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;"
                    >
                    <label for="check-${plan.id}" style="font-size: 13px; font-weight: 600; cursor: pointer; color: var(--muted);">
                        ${isDone ? '✅ Realizado' : 'Check ✔️'}
                    </label>
                </div>

                <div class="card-header" style="margin-bottom: 6px;">
                    <span class="badge-category">${cat.icon} ${cat.name} ${dateText}${timeText}</span>
                </div>

                <h3 style="margin: 4px 0 8px 0; font-size: 17px; ${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${escapeHTML(plan.title)}</h3>
                ${plan.location_name ? `<div style="font-size: 13px; color: var(--muted); margin-top: 4px;">📍 ${escapeHTML(plan.location_name)}</div>` : ''}
                ${plan.description ? `<p style="font-size: 13px; margin-top: 6px; opacity: 0.8;">${escapeHTML(plan.description)}</p>` : ''}
            </div>
        `;[cite: 5]
    }).join("");
}

window.togglePlanCompleted = async function(id, isChecked) {[cite: 5]
    const plan = state.plans.find(p => p.id == id);[cite: 5]
    if (plan) {[cite: 5]
        plan.completed = isChecked;[cite: 5]
        renderPlans();[cite: 5]
    }

    if (supabaseApp) {[cite: 5]
        const { error } = await supabaseApp[cite: 5]
            .from("plans")[cite: 5]
            .update({ completed: isChecked })[cite: 5]
            .eq("id", id);[cite: 5]

        if (error) {[cite: 5]
            console.error("Error actualizando estado completado:", error);[cite: 5]
            if (plan) plan.completed = !isChecked;[cite: 5]
            renderPlans();[cite: 5]
        }
    }
};

window.editPlan = function(id) {[cite: 5]
    const plan = state.plans.find(p => p.id == id);[cite: 5]
    if (plan) openPlanModal(plan);[cite: 5]
};

window.deletePlan = async function(id) {[cite: 5]
    if (!confirm("¿Seguro que deseas borrar este plan?")) return;[cite: 5]

    if (supabaseApp) {[cite: 5]
        await supabaseApp.from("plans").delete().eq("id", id);[cite: 5]
    }
    loadAllData();[cite: 5]
};

function setupFilters() {[cite: 5]
    const filterBtns = document.querySelectorAll("[data-plan-filter]");[cite: 5]
    filterBtns.forEach(btn => {[cite: 5]
        btn.addEventListener("click", () => {[cite: 5]
            filterBtns.forEach(b => b.classList.remove("active"));[cite: 5]
            btn.classList.add("active");[cite: 5]
            state.activePlanFilter = btn.getAttribute("data-plan-filter");[cite: 5]
            renderPlans();[cite: 5]
        });
    });
}

function renderNextActivity() {[cite: 5]
    const nextEl = document.getElementById("next-activity");[cite: 5]
    if (!nextEl) return;[cite: 5]

    const today = new Date().toISOString().split("T")[0];[cite: 5]
    const upcoming = state.plans[cite: 5]
        .filter(p => !p.completed && p.date && p.date >= today)[cite: 5]
        .sort((a, b) => new Date(a.date) - new Date(b.date));[cite: 5]

    if (upcoming.length > 0) {[cite: 5]
        const next = upcoming[0];[cite: 5]
        const dateObj = new Date(next.date + "T00:00:00");[cite: 5]
        const dateText = dateObj.toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short' });[cite: 5]

        nextEl.innerHTML = `
            <span>📅</span>
            <div>
                <strong>${escapeHTML(next.title)}</strong>
                <p>${dateText} ${next.time ? 'a las ' + next.time : ''} — ${next.location_name ? escapeHTML(next.location_name) : 'Nueva York'}</p>
            </div>
        `;[cite: 5]
    } else {
        nextEl.innerHTML = `
            <span>🗽</span>
            <div>
                <strong>¡Sin planes próximos!</strong>
                <p>Añade actividades para sincronizarlas con el mapa.</p>
            </div>
        `;[cite: 5]
    }
}

/* ==========================================================================
   TIEMPO Y DIVISAS[cite: 5]
   ========================================================================== */
async function updateWeather() {[cite: 5]
    try {[cite: 5]
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7143&longitude=-74.006&current_weather=true");[cite: 5]
        const data = await res.json();[cite: 5]
        if (data.current_weather) {[cite: 5]
            document.getElementById("weather-temperature").textContent = `${Math.round(data.current_weather.temperature)}°C`;[cite: 5]
            document.getElementById("weather-description").textContent = "Nueva York";[cite: 5]
            document.getElementById("weather-wind").textContent = `Viento: ${Math.round(data.current_weather.windspeed)} km/h`;[cite: 5]
            document.getElementById("weather-update").textContent = "Actualizado";[cite: 5]
        }
    } catch (e) {[cite: 5]
        console.warn("Error tiempo:", e);[cite: 5]
    }
}

async function updateCurrency() {[cite: 5]
    try {[cite: 5]
        const res = await fetch("https://open.er-api.com/v6/latest/EUR");[cite: 5]
        const data = await res.json();[cite: 5]
        if (data && data.rates && data.rates.USD) {[cite: 5]
            document.getElementById("currency-value").textContent = `1 € = ${data.rates.USD.toFixed(2)} $`;[cite: 5]
            document.getElementById("currency-update").textContent = "Tiempo real";[cite: 5]
        }
    } catch (e) {[cite: 5]
        console.warn("Error divisas:", e);[cite: 5]
    }
}

function renderReservations() {[cite: 5]
    const listEl = document.getElementById("reservation-list");[cite: 5]
    if (!listEl) return;[cite: 5]

    if (state.reservations.length === 0) {[cite: 5]
        listEl.innerHTML = `<div class="empty-state">No hay reservas registradas.</div>`;[cite: 5]
        return;[cite: 5]
    }

    listEl.innerHTML = state.reservations.map(r => `
        <div class="card">
            <h3>📋 ${escapeHTML(r.title)}</h3>
            ${r.description ? `<p>${escapeHTML(r.description)}</p>` : ''}
            <small>${r.date || 'Sin fecha'} ${r.time || ''} ${r.location ? '— ' + escapeHTML(r.location) : ''}</small>
        </div>
    `).join("");[cite: 5]
}

function renderExpenses() {[cite: 5]
    const listEl = document.getElementById("expense-list");[cite: 5]
    const summaryEl = document.getElementById("expense-summary");[cite: 5]
    if (!listEl) return;[cite: 5]

    if (state.expenses.length === 0) {[cite: 5]
        listEl.innerHTML = `<div class="empty-state">No hay gastos registrados.</div>`;[cite: 5]
        if (summaryEl) summaryEl.innerHTML = "";[cite: 5]
        return;[cite: 5]
    }

    let totalUSD = 0;[cite: 5]
    state.expenses.forEach(e => {[cite: 5]
        totalUSD += e.currency === 'EUR' ? e.amount * 1.08 : e.amount;[cite: 5]
    });

    if (summaryEl) {[cite: 5]
        summaryEl.innerHTML = `
            <div class="info-card" style="padding: 12px; background: var(--card-bg, #fff); border-radius: 8px; margin-bottom: 12px;">
                <strong>Gasto Total Aprox:</strong> $${totalUSD.toFixed(2)} USD
                <small style="display: block; color: var(--muted);">(${state.expenses.length} pagos realizados)</small>
            </div>
        `;[cite: 5]
    }

    listEl.innerHTML = state.expenses.map(e => `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${escapeHTML(e.title)}</strong>
                <span class="badge-amount">${e.amount} ${e.currency}</span>
            </div>
            <p style="margin: 4px 0;">Pagó: <strong>${escapeHTML(e.paid_by)}</strong></p>
        </div>
    `).join("");[cite: 5]
}

function renderFlights() {[cite: 5]
    const listEl = document.getElementById("flight-list");[cite: 5]
    if (!listEl) return;[cite: 5]

    listEl.innerHTML = state.flights.map(f => `
        <div class="card">
            <h3>✈️ Vuelo de ${escapeHTML(f.type)}</h3>
            <strong>${escapeHTML(f.route)}</strong>
            <p>📅 ${escapeHTML(f.date)}</p>
            <small>${escapeHTML(f.details)}</small>
        </div>
    `).join("");[cite: 5]
}

function renderHotel() {[cite: 5]
    const container = document.getElementById("hotel-container");[cite: 5]
    if (!container) return;[cite: 5]

    const h = state.hotel;[cite: 5]
    container.innerHTML = `
        <div class="card hotel-card">
            <h3>🏨 ${escapeHTML(h.name)}</h3>
            <p>📍 ${escapeHTML(h.address)}</p>
            <small>📅 Entrada: ${escapeHTML(h.checkIn)} | Salida: ${escapeHTML(h.checkOut)}</small>
        </div>
    `;[cite: 5]
}

/* ==========================================================================
   MAPA LEAFLET[cite: 5]
   ========================================================================== */
function initOrRefreshMap() {[cite: 5]
    if (typeof L === 'undefined') return;[cite: 5]

    const mapContainer = document.getElementById("map");[cite: 5]
    if (!mapContainer) return;[cite: 5]

    if (!state.map) {[cite: 5]
        state.map = L.map("map").setView([state.hotel.lat, state.hotel.lng], 13);[cite: 5]
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {[cite: 5]
            attribution: "© OpenStreetMap"[cite: 5]
        }).addTo(state.map);[cite: 5]
    }
    
    state.map.invalidateSize();[cite: 5]
    renderMap();[cite: 5]
}

function renderMap() {[cite: 5]
    if (!state.map) return;[cite: 5]

    state.markers.forEach(m => state.map.removeLayer(m));[cite: 5]
    state.markers = [];[cite: 5]

    const bounds = [];[cite: 5]

    if (state.hotel && state.hotel.lat && state.hotel.lng) {[cite: 5]
        bounds.push([state.hotel.lat, state.hotel.lng]);[cite: 5]
        
        const hotelIcon = L.divIcon({[cite: 5]
            className: 'custom-map-marker',[cite: 5]
            html: `<div class="marker-pin">🏨</div>`,[cite: 5]
            iconSize: [36, 36],[cite: 5]
            iconAnchor: [18, 18],[cite: 5]
            popupAnchor: [0, -18][cite: 5]
        });

        const hotelMarker = L.marker([state.hotel.lat, state.hotel.lng], { icon: hotelIcon })[cite: 5]
            .addTo(state.map)[cite: 5]
            .bindPopup(`<b>🏨 ${escapeHTML(state.hotel.name)}</b><br>${escapeHTML(state.hotel.address)}`);[cite: 5]
        
        state.markers.push(hotelMarker);[cite: 5]
    }

    state.plans.forEach(plan => {[cite: 5]
        const lat = parseFloat(plan.latitude);[cite: 5]
        const lng = parseFloat(plan.longitude);[cite: 5]

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {[cite: 5]
            const emoji = getCategoryIcon(plan.category ? plan.category.toLowerCase() : 'other');[cite: 5]

            const customIcon = L.divIcon({[cite: 5]
                className: 'custom-map-marker',[cite: 5]
                html: `<div class="marker-pin">${emoji}</div>`,[cite: 5]
                iconSize: [36, 36],[cite: 5]
                iconAnchor: [18, 18],[cite: 5]
                popupAnchor: [0, -18][cite: 5]
            });

            const marker = L.marker([lat, lng], { icon: customIcon })[cite: 5]
                .addTo(state.map)[cite: 5]
                .bindPopup(`
                    <b>${emoji} ${escapeHTML(plan.title)}</b><br>
                    ${plan.location_name ? '📍 ' + escapeHTML(plan.location_name) : ''}<br>
                    ${plan.description ? '<small>' + escapeHTML(plan.description) + '</small>' : ''}
                `);[cite: 5]

            state.markers.push(marker);[cite: 5]
            bounds.push([lat, lng]);[cite: 5]
        }
    });

    if (bounds.length > 0) {[cite: 5]
        state.map.fitBounds(bounds, { padding: [40, 40] });[cite: 5]
    }
}
