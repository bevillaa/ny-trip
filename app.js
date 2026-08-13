/* ==========================================================================
   🗽 NY TRIP - APP.JS
   ========================================================================== */

// Configuración de Supabase
const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YnJuYnlvc3J0eGVheXFtdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUwODQsImV4cCI6MjEwMjAzMTA4NH0.W3mCe1yAehFd0bz_XNVJ83YR-dNz-8VZnnhgj-cQEss";

// Inicialización limpia y directa del cliente
var supabaseApp = null;
if (window.supabase) {
    supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

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
    activePlanFilter: 'all',
    editingExpenseId: null // ID del gasto en edición
};

// CATEGORÍAS DE PLANES
const CATEGORIES = {
    food: { name: "Restaurantes", icon: "🍽️" },
    sweet: { name: "Dulces", icon: "🍪" },
    activity: { name: "Spots", icon: "📍" },
    shopping: { name: "Tiendas", icon: "🛍️" },
    sightseeing: { name: "Turisteo", icon: "🗽" },
    other: { name: "Otros", icon: "📌" }
};

// Lista de integrantes
const USERS = ["Laura", "Sara", "Belén"];

// Función auxiliar para obtener el icono según la categoría
function getCategoryIcon(category) {
    if (CATEGORIES[category]) {
        return CATEGORIES[category].icon;
    }
    return "📌";
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupNavigation();
    setupModals();
    setupForms();
    setupFilters();
    setupLocationSearch();
    setupTravelersClick(); // Evento para que "El Equipo" lleve a Gastos

    startClocksAndCountdown();

    if (supabaseApp) {
        supabaseApp.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                handleLoginSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                showLoginScreen();
            }
        });

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
   AUTENTICACIÓN
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
                    errorDiv.textContent = "Error de conexión con Supabase.";
                    errorDiv.hidden = false;
                }
                return;
            }

            try {
                const { data, error } = await supabaseApp.auth.signInWithPassword({ email, password });

                if (error) {
                    if (errorDiv) {
                        let msg = error.message;
                        if (msg.includes("Invalid login credentials")) msg = "Usuario o contraseña incorrectos.";
                        errorDiv.textContent = msg;
                        errorDiv.hidden = false;
                    }
                } else if (data && data.user) {
                    handleLoginSuccess(data.user);
                }
            } catch (err) {
                console.error("Error en login:", err);
            }
        });
    }

    const logoutBtn = document.getElementById("logout-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (supabaseApp) await supabaseApp.auth.signOut();
            state.currentUser = null;
            showLoginScreen();
        });
    }
});

/* ==========================================================================
   RELOJES Y CONTADOR
   ========================================================================== */
function startClocksAndCountdown() {
    updateClocksAndCountdown();
    setInterval(updateClocksAndCountdown, 1000);
}

function updateClocksAndCountdown() {
    const now = new Date();

    const malagaTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const nyTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const clocksEl = document.getElementById("header-clocks");
    if (clocksEl) {
        clocksEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-weight: 600;">
                <span>🗽 NY</span> <strong>${nyTimeStr}</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; opacity: 0.85; font-weight: 500;">
                <span>💃 Málaga</span> <strong>${malagaTimeStr}</strong>
            </div>
        `;
    }

    const dayEl = document.getElementById("trip-day");
    if (dayEl) {
        const startDate = new Date(2026, 11, 26);
        const endDate = new Date(2027, 0, 4);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round((startDate - todayMidnight) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            dayEl.textContent = `Faltan ${diffDays} días`;
        } else if (diffDays <= 0 && todayMidnight <= endDate) {
            dayEl.textContent = `¡Día ${Math.abs(diffDays) + 1} en NY! 🗽`;
        } else {
            dayEl.textContent = "Viaje Finalizado ❤️";
        }
    }
}

/* ==========================================================================
   BÚSQUEDA Y GEOCODIFICACIÓN (PHOTON)
   ========================================================================== */
function setupLocationSearch() {
    initPhotonAutocomplete("plan-location", "plan-location-results");
    initPhotonAutocomplete("reservation-location", "reservation-location-results");
}

function initPhotonAutocomplete(inputId, resultsContainerId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let container = document.getElementById(resultsContainerId);
    if (!container) {
        container = document.createElement("div");
        container.id = resultsContainerId;
        container.className = "search-results-dropdown";
        input.parentNode.style.position = "relative";
        input.parentNode.appendChild(container);
    }

    let timeout = null;

    input.addEventListener("input", () => {
        clearTimeout(timeout);
        delete input.dataset.lat;
        delete input.dataset.lng;

        const query = input.value.trim();
        if (query.length < 2) {
            container.innerHTML = "";
            return;
        }

        timeout = setTimeout(async () => {
            try {
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=40.7128&lon=-73.9352&limit=5`;
                const res = await fetch(url);
                const data = await res.json();

                container.innerHTML = "";

                if (!data.features || data.features.length === 0) {
                    container.innerHTML = `<div style="padding: 10px; color: var(--muted); font-size: 13px;">Sin resultados encontrados</div>`;
                    return;
                }

                data.features.forEach(feature => {
                    const props = feature.properties;
                    const coords = feature.geometry.coordinates; // [lon, lat]
                    const name = props.name || query;
                    const city = props.city || props.state || "New York";
                    const fullAddress = `${props.street ? props.street + ', ' : ''}${city}`;

                    const item = document.createElement("div");
                    item.className = "search-result-item";
                    item.innerHTML = `
                        <strong style="display: block; font-size: 14px;">📍 ${escapeHTML(name)}</strong>
                        <span style="font-size: 11px; color: var(--muted); display: block;">${escapeHTML(fullAddress)}</span>
                    `;

                    item.addEventListener("click", () => {
                        selectSearchLocation(name, inputId, resultsContainerId, coords[1], coords[0]);
                    });

                    container.appendChild(item);
                });
            } catch (err) {
                console.error("Error en autocompletado Photon:", err);
            }
        }, 250);
    });

    document.addEventListener("click", (e) => {
        if (e.target !== input && !container.contains(e.target)) {
            container.innerHTML = "";
        }
    });
}

function selectSearchLocation(name, inputId, resultsContainerId, lat, lon) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = name;
        input.dataset.lat = lat;
        input.dataset.lng = lon;
    }
    const container = document.getElementById(resultsContainerId);
    if (container) container.innerHTML = "";
}

async function geocodeAddress(query) {
    try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=40.7128&lon=-73.9352&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            return { lat: coords[1], lng: coords[0] };
        }
    } catch (e) {
        console.warn("No se pudo geocodificar:", query, e);
    }
    return { lat: 40.7128, lng: -74.0060 };
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

        if (plansRes.error) console.error("Error cargando planes:", plansRes.error);
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
   NAVEGACIÓN DE PANTALLAS Y NAVEGACIÓN DESDE EL EQUIPO
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

function setupTravelersClick() {
    const cards = document.querySelectorAll(".traveler-card");
    cards.forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            switchScreen("expenses");
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
        setTimeout(initOrRefreshMap, 150);
    }
}

/* ==========================================================================
   GESTIÓN DE MODALES Y GASTOS (NUEVO / EDICIÓN)
   ========================================================================== */
function setupModals() {
    document.getElementById("open-plan-form")?.addEventListener("click", () => openPlanModal());
    document.getElementById("open-reservation-form")?.addEventListener("click", () => openModal("reservation-modal"));
    document.getElementById("open-expense-form")?.addEventListener("click", () => openExpenseModal());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
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

    const resultsContainer = document.getElementById("plan-location-results");
    if (resultsContainer) resultsContainer.innerHTML = "";

    const locInput = document.getElementById("plan-location");

    if (planToEdit) {
        document.getElementById("plan-id").value = planToEdit.id;
        document.getElementById("plan-title").value = planToEdit.title || "";
        document.getElementById("plan-category").value = planToEdit.category || "other";
        document.getElementById("plan-description").value = planToEdit.description || "";
        document.getElementById("plan-date").value = planToEdit.date || ""; 
        document.getElementById("plan-time").value = planToEdit.time || "";
        
        if (locInput) {
            locInput.value = planToEdit.location_name || "";
            locInput.dataset.lat = planToEdit.latitude || "";
            locInput.dataset.lng = planToEdit.longitude || "";
        }
    } else {
        const idInput = document.getElementById("plan-id");
        if (idInput) idInput.value = "";
        if (locInput) {
            delete locInput.dataset.lat;
            delete locInput.dataset.lng;
        }
    }

    openModal("plan-modal");
}

function openExpenseModal(expenseToEdit = null) {
    const form = document.getElementById("expense-form");
    if (form) form.reset();

    if (expenseToEdit) {
        state.editingExpenseId = expenseToEdit.id;
        document.getElementById("expense-title").value = expenseToEdit.title || "";
        document.getElementById("expense-amount").value = expenseToEdit.amount || "";
        document.getElementById("expense-currency").value = expenseToEdit.currency || "EUR";
        document.getElementById("expense-paid-by").value = expenseToEdit.paid_by || "Laura";
        document.getElementById("expense-date").value = expenseToEdit.date || new Date().toISOString().split("T")[0];
        
        const notesInput = document.getElementById("expense-notes");
        if (notesInput) notesInput.value = expenseToEdit.notes || "";

        const checkboxes = document.querySelectorAll("input[name='participant']");
        const parts = expenseToEdit.participants || USERS;
        checkboxes.forEach(cb => {
            cb.checked = parts.includes(cb.value);
        });
    } else {
        state.editingExpenseId = null;
        document.querySelectorAll("input[name='participant']").forEach(cb => cb.checked = true);
        document.getElementById("expense-date").value = new Date().toISOString().split("T")[0];
    }

    openModal("expense-modal");
}

/* ==========================================================================
   FORMULARIOS (INCLUYENDO ACTUALIZAR/CREAR GASTOS)
   ========================================================================== */
function setupForms() {
    document.getElementById("plan-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";
        }

        try {
            const id = document.getElementById("plan-id").value;
            const titleVal = document.getElementById("plan-title").value.trim();
            const dateVal = document.getElementById("plan-date").value;
            const locInput = document.getElementById("plan-location");
            const locationText = locInput ? locInput.value.trim() : "";

            if (!titleVal) {
                alert("Por favor introduce un título para el plan.");
                return;
            }

            let lat = locInput && locInput.dataset.lat ? parseFloat(locInput.dataset.lat) : null;
            let lng = locInput && locInput.dataset.lng ? parseFloat(locInput.dataset.lng) : null;

            if (locationText && (!lat || !lng)) {
                const coords = await geocodeAddress(locationText);
                if (coords) {
                    lat = coords.lat;
                    lng = coords.lng;
                }
            }

            const planData = {
                title: titleVal,
                category: document.getElementById("plan-category").value || "other",
                description: document.getElementById("plan-description").value || null,
                date: dateVal ? dateVal : null,
                time: document.getElementById("plan-time").value || null,
                location_name: locationText || null,
                latitude: lat,
                longitude: lng,
                created_by: state.currentUser ? (state.currentUser.email || state.currentUser.id) : "invitado"
            };

            if (!supabaseApp) throw new Error("No hay conexión con Supabase.");

            let result;
            if (id) {
                result = await supabaseApp.from("plans").update(planData).eq("id", id);
            } else {
                result = await supabaseApp.from("plans").insert([planData]);
            }

            if (result.error) {
                throw new Error(result.error.message);
            }

            closeModal("plan-modal");
            await loadAllData();

        } catch (err) {
            console.error("Error al guardar plan:", err);
            alert("⚠️ No se pudo guardar el plan: " + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Guardar Plan";
            }
        }
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
        
        if (participants.length === 0) {
            alert("Selecciona al menos a un participante para el gasto.");
            return;
        }

        const notesVal = document.getElementById("expense-notes")?.value || "";

        const expData = {
            title: document.getElementById("expense-title").value,
            amount: parseFloat(document.getElementById("expense-amount").value),
            currency: document.getElementById("expense-currency").value,
            paid_by: document.getElementById("expense-paid-by").value,
            participants: participants,
            date: document.getElementById("expense-date").value || new Date().toISOString().split("T")[0],
            notes: notesVal
        };

        if (supabaseApp) {
            if (state.editingExpenseId) {
                await supabaseApp.from("expenses").update(expData).eq("id", state.editingExpenseId);
            } else {
                await supabaseApp.from("expenses").insert([expData]);
            }
        }

        closeModal("expense-modal");
        loadAllData();
    });
}

/* ==========================================================================
   RENDERIZADO DE VISTAS DE PLANES
   ========================================================================== */
function renderPlans() {
    const listEl = document.getElementById("plan-list");
    if (!listEl) return;

    let filtered = state.plans;
    if (state.activePlanFilter !== 'all') {
        filtered = filtered.filter(p => p.category === state.activePlanFilter);
    }

    if (!filtered || filtered.length === 0) {
        listEl.innerHTML = `<div class="empty">No hay planes registrados en esta categoría.</div>`;
        return;
    }

    filtered.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    listEl.innerHTML = filtered.map(plan => {
        const cat = CATEGORIES[plan.category] || CATEGORIES.other;
        
        let dateText = "Por definir";
        if (plan.date) {
            const dateObj = new Date(plan.date + "T00:00:00");
            dateText = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        }

        const timeText = plan.time ? ` ⏰ ${plan.time}` : "";

        return `
            <div class="card plan-card">
                <div class="card-actions">
                    <button class="icon-button" onclick="editPlan('${plan.id}')" title="Editar">✏️</button>
                    <button class="icon-button danger" onclick="deletePlan('${plan.id}')" title="Borrar">🗑️</button>
                </div>
                <div class="card-header" style="margin-bottom: 6px;">
                    <span class="badge-category">${cat.icon} ${cat.name} ${dateText}${timeText}</span>
                </div>
                <h3 style="margin: 4px 0 8px 0; font-size: 17px;">${escapeHTML(plan.title)}</h3>
                ${plan.location_name ? `<div style="font-size: 13px; color: var(--muted); margin-top: 4px;">📍 ${escapeHTML(plan.location_name)}</div>` : ''}
                ${plan.description ? `<p style="font-size: 13px; margin-top: 6px; opacity: 0.8;">${escapeHTML(plan.description)}</p>` : ''}
            </div>
        `;
    }).join("");
}

window.editPlan = function(id) {
    const plan = state.plans.find(p => p.id == id);
    if (plan) openPlanModal(plan);
};

window.deletePlan = async function(id) {
    if (!confirm("¿Seguro que deseas borrar este plan?")) return;

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
                <strong>${escapeHTML(next.title)}</strong>
                <p>${dateText} ${next.time ? 'a las ' + next.time : ''} — ${next.location_name ? escapeHTML(next.location_name) : 'Nueva York'}</p>
            </div>
        `;
    } else {
        nextEl.innerHTML = `
            <span>🗽</span>
            <div>
                <strong>¡Sin planes próximos!</strong>
                <p>Añade actividades para sincronizarlas con el mapa.</p>
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
        console.warn("Error tiempo:", e);
    }
}

async function updateCurrency() {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/EUR");
        const data = await res.json();
        if (data && data.rates && data.rates.USD) {
            document.getElementById("currency-value").textContent = `1 € = ${data.rates.USD.toFixed(2)} $`;
            document.getElementById("currency-update").textContent = "Tiempo real";
        }
    } catch (e) {
        console.warn("Error divisas:", e);
    }
}

function renderReservations() {
    const listEl = document.getElementById("reservation-list");
    if (!listEl) return;

    if (state.reservations.length === 0) {
        listEl.innerHTML = `<div class="empty">No hay reservas registradas.</div>`;
        return;
    }

    listEl.innerHTML = state.reservations.map(r => `
        <div class="card">
            <h3>📋 ${escapeHTML(r.title)}</h3>
            ${r.description ? `<p>${escapeHTML(r.description)}</p>` : ''}
            <small>${r.date || 'Sin fecha'} ${r.time || ''} ${r.location ? '— ' + escapeHTML(r.location) : ''}</small>
        </div>
    `).join("");
}

/* ==========================================================================
   TRICOUNT Y RESUMEN DE GASTOS / DEUDAS
   ========================================================================== */
function renderExpenses() {
    const listEl = document.getElementById("expense-list");
    const summaryEl = document.getElementById("expense-summary");
    const debtsEl = document.getElementById("debts");
    if (!listEl) return;

    if (state.expenses.length === 0) {
        listEl.innerHTML = `<div class="empty">No hay gastos registrados.</div>`;
        if (summaryEl) summaryEl.innerHTML = "";
        if (debtsEl) debtsEl.innerHTML = "<div class='empty'>No hay deudas calculadas.</div>";
        return;
    }

    // 1. Cálculo de Balances y Ajuste de Divisas (€ como base)
    const balances = { Laura: 0, Sara: 0, Belén: 0 };

    state.expenses.forEach(e => {
        const amountEUR = e.currency === 'USD' ? e.amount / 1.08 : e.amount;
        const payer = e.paid_by;
        const participants = (e.participants && e.participants.length > 0) ? e.participants : USERS;
        const splitAmount = amountEUR / participants.length;

        if (balances[payer] !== undefined) {
            balances[payer] += amountEUR;
        }

        participants.forEach(p => {
            if (balances[p] !== undefined) {
                balances[p] -= splitAmount;
            }
        });
    });

    // Renderizado de Resumen por Usuario
    if (summaryEl) {
        summaryEl.innerHTML = USERS.map(user => {
            const bal = balances[user] || 0;
            const isPos = bal >= 0;
            const cls = isPos ? "positive" : "negative";
            const sign = isPos ? "+" : "";
            return `
                <div class="balance-card">
                    <span>${user}</span>
                    <strong class="${cls}">${sign}${bal.toFixed(2)} €</strong>
                </div>
            `;
        }).join("");
    }

    // 2. Cálculo Simplificado de Deudas
    if (debtsEl) {
        const debtors = [];
        const creditors = [];

        USERS.forEach(u => {
            const b = balances[u] || 0;
            if (b < -0.01) debtors.push({ user: u, amount: -b });
            else if (b > 0.01) creditors.push({ user: u, amount: b });
        });

        const debtList = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            const payment = Math.min(debtor.amount, creditor.amount);

            debtList.push(`
                <div class="debt-card">
                    <div>
                        <strong>${debtor.user}</strong> debe a <strong>${creditor.user}</strong>
                    </div>
                    <span class="debt-amount positive">${payment.toFixed(2)} €</span>
                </div>
            `);

            debtor.amount -= payment;
            creditor.amount -= payment;

            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        debtsEl.innerHTML = debtList.length > 0 ? debtList.join("") : "<div class='empty'>¡Cuentas al día! Nadie debe nada. 🎉</div>";
    }

    // 3. Renderizado de la Lista de Gastos con Opciones de Editar y Eliminar
    listEl.innerHTML = state.expenses.map(e => `
        <div class="expense-card">
            <div class="card-main">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:15px;">${escapeHTML(e.title)}</strong>
                    <strong style="font-size:15px;">${e.amount} ${e.currency}</strong>
                </div>
                <p>Pagó: <strong>${escapeHTML(e.paid_by)}</strong> • Para: ${e.participants ? e.participants.map(p => escapeHTML(p)).join(", ") : "Todos"}</p>
                ${e.date ? `<small style="color:var(--muted); font-size:11px;">📅 ${e.date}</small>` : ''}
            </div>
            <div class="card-actions" style="position:static; margin-left:10px;">
                <button class="icon-button" onclick="editExpense('${e.id}')" title="Editar gasto">✏️</button>
                <button class="icon-button danger" onclick="deleteExpense('${e.id}')" title="Borrar gasto">🗑️</button>
            </div>
        </div>
    `).join("");
}

window.editExpense = function(id) {
    const exp = state.expenses.find(e => e.id == id);
    if (exp) openExpenseModal(exp);
};

window.deleteExpense = async function(id) {
    if (!confirm("¿Seguro que deseas eliminar este gasto?")) return;

    if (supabaseApp) {
        await supabaseApp.from("expenses").delete().eq("id", id);
    }
    loadAllData();
};

function renderFlights() {
    const listEl = document.getElementById("flight-list");
    if (!listEl) return;

    listEl.innerHTML = state.flights.map(f => `
        <div class="card">
            <h3>✈️ Vuelo de ${escapeHTML(f.type)}</h3>
            <strong>${escapeHTML(f.route)}</strong>
            <p>📅 ${escapeHTML(f.date)}</p>
            <small>${escapeHTML(f.details)}</small>
        </div>
    `).join("");
}

function renderHotel() {
    const container = document.getElementById("hotel-container");
    if (!container) return;

    const h = state.hotel;
    container.innerHTML = `
        <div class="card hotel-card">
            <h3>🏨 ${escapeHTML(h.name)}</h3>
            <p>📍 ${escapeHTML(h.address)}</p>
            <small>📅 Entrada: ${escapeHTML(h.checkIn)} | Salida: ${escapeHTML(h.checkOut)}</small>
        </div>
    `;
}

/* ==========================================================================
   MAPA LEAFLET CON ICONOS PERSONALIZADOS POR CATEGORÍA
   ========================================================================== */
function initOrRefreshMap() {
    if (typeof L === 'undefined') return;

    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    if (!state.map) {
        state.map = L.map("map").setView([40.7580, -73.9855], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(state.map);
    }
    
    state.map.invalidateSize();
    renderMap();
}

function renderMap() {
    if (!state.map) return;

    state.markers.forEach(m => state.map.removeLayer(m));
    state.markers = [];

    const bounds = [];

    // 1. Marcador del Hotel (Icono 🏨)
    if (state.hotel && state.hotel.lat && state.hotel.lng) {
        bounds.push([state.hotel.lat, state.hotel.lng]);
        
        const hotelIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div class="marker-pin">🏨</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });

        const hotelMarker = L.marker([state.hotel.lat, state.hotel.lng], { icon: hotelIcon })
            .addTo(state.map)
            .bindPopup(`<b>🏨 ${escapeHTML(state.hotel.name)}</b><br>${escapeHTML(state.hotel.address)}`);
        
        state.markers.push(hotelMarker);
    }

    // 2. Marcadores de Planes
    state.plans.forEach(plan => {
        const lat = parseFloat(plan.latitude);
        const lng = parseFloat(plan.longitude);

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            const emoji = getCategoryIcon(plan.category);

            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="marker-pin">${emoji}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
            });

            const marker = L.marker([lat, lng], { icon: customIcon })
                .addTo(state.map)
                .bindPopup(`
                    <b>${emoji} ${escapeHTML(plan.title)}</b><br>
                    ${plan.location_name ? '📍 ' + escapeHTML(plan.location_name) : ''}<br>
                    ${plan.description ? '<small>' + escapeHTML(plan.description) + '</small>' : ''}
                `);

            state.markers.push(marker);
            bounds.push([lat, lng]);
        }
    });

    // Enmarcar todos los puntos en la pantalla
    if (bounds.length > 0) {
        state.map.fitBounds(bounds, { padding: [40, 40] });
    }
}
