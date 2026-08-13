/* ==========================================
   🗽 NY TRIP — DISEÑO COMPLETO
========================================== */

* {
    box-sizing: border-box;
}

:root {
    --bg: #f4f6fa;
    --card: #ffffff;/* ==========================================================================
   🗽 NY TRIP - APP.JS
   ========================================================================== */

// Configuración de Supabase
const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YnJuYnlvc3J0eGVheXFtdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUwODQsImV4cCI6MjEwMjAzMTA4NH0.W3mCe1yAehFd0bz_XNVJ83YR-dNz-8VZnnhgj-cQEss";

// Inicialización de Supabase
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
    // HOTEL ACTUALIZADO: Courtyard Upper East Side
    hotel: {
        name: "Courtyard by Marriott New York Manhattan/Upper East Side",
        address: "410 East 92nd Street, Upper East Side, New York, NY 10128",
        lat: 40.7797,
        lng: -73.9472,
        checkIn: "26 Dic 2026 (15:00)",
        checkOut: "04 Ene 2027 (12:00)"
    },
    flights: [
        { type: "Ida", route: "MAD → JFK", date: "26 Dic 2026", details: "Salida: 10:00 - Llegada: 12:30 (Directo)" },
        { type: "Vuelta", route: "JFK → MAD", date: "04 Ene 2027", details: "Salida: 19:30 - Llegada: 08:50 (+1 día)" }
    ],
    map: null,
    markers: [],
    activePlanFilter: 'all'
};

// MAPEO UNIFICADO Y FLEXIBLE DE CATEGORÍAS
const CATEGORIES = {
    food: { name: "Restaurantes", icon: "🍽️" },
    restaurant: { name: "Restaurantes", icon: "🍽️" },
    restaurantes: { name: "Restaurantes", icon: "🍽️" },
    
    sweet: { name: "Dulces", icon: "🍪" },
    dulces: { name: "Dulces", icon: "🍪" },
    dulce: { name: "Dulces", icon: "🍪" },
    
    activity: { name: "Spots", icon: "📍" },
    spot: { name: "Spots", icon: "📍" },
    spots: { name: "Spots", icon: "📍" },
    
    shopping: { name: "Tiendas", icon: "🛍️" },
    tiendas: { name: "Tiendas", icon: "🛍️" },
    
    sightseeing: { name: "Turisteo", icon: "🗽" },
    turisteo: { name: "Turisteo", icon: "🗽" },
    
    other: { name: "Otros", icon: "📌" },
    otros: { name: "Otros", icon: "📌" }
};

function getCategoryIcon(category) {
    if (!category) return "📌";
    const key = category.toString().trim().toLowerCase();
    return CATEGORIES[key] ? CATEGORIES[key].icon : "📌";
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
        setTimeout(initOrRefreshMap, 150);
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

/* ==========================================================================
   FORMULARIO DE PLANES
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

            // MAPEO TIPO CHECK CONSTRAINT SEGÚN NOMBRES ESPAÑOL/INGLÉS
            const CATEGORY_TO_DB = {
                food: "Restaurantes",
                sweet: "Dulces",
                activity: "Spots",
                shopping: "Tiendas",
                sightseeing: "Turisteo",
                other: "Otros"
            };

            const rawCategory = document.getElementById("plan-category").value || "other";
            const dbCategory = CATEGORY_TO_DB[rawCategory] || rawCategory;

            const planData = {
                title: titleVal,
                category: dbCategory,
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
   RENDERIZADO DE VISTAS DE PLANES CON CHECK COMPLETADO Y FILTROS
   ========================================================================== */
function renderPlans() {
    const listEl = document.getElementById("plan-list");
    if (!listEl) return;

    let filtered = state.plans;

    // 1. Filtrado por categoría
    if (state.activePlanFilter !== 'all') {
        filtered = filtered.filter(p => {
            if (!p.category) return state.activePlanFilter === 'other';
            
            const cat = p.category.toString().trim().toLowerCase();
            const filter = state.activePlanFilter.toLowerCase();

            if (filter === 'food') return cat === 'food' || cat === 'restaurant' || cat === 'restaurantes';
            if (filter === 'sweet') return cat === 'sweet' || cat === 'dulce' || cat === 'dulces';
            if (filter === 'activity') return cat === 'activity' || cat === 'spot' || cat === 'spots';
            if (filter === 'shopping') return cat === 'shopping' || cat === 'tiendas';
            if (filter === 'sightseeing') return cat === 'sightseeing' || cat === 'turisteo' || cat === 'nightlife';
            if (filter === 'other') return cat === 'other' || cat === 'otros';

            return cat === filter;
        });
    }

    if (!filtered || filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding: 20px; text-align: center; color: var(--muted);">No hay planes registrados en esta categoría.</div>`;
        return;
    }

    // 2. Ordenación: Pendientes arriba (por fecha), Completados abajo (por fecha)
    filtered.sort((a, b) => {
        const aDone = a.completed ? 1 : 0;
        const bDone = b.completed ? 1 : 0;

        if (aDone !== bDone) {
            return aDone - bDone;
        }

        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    // 3. Renderizado HTML
    listEl.innerHTML = filtered.map(plan => {
        const catKey = plan.category ? plan.category.toString().trim().toLowerCase() : 'other';
        const cat = CATEGORIES[catKey] || CATEGORIES.other;
        const isDone = !!plan.completed;

        let dateText = "Por definir";
        if (plan.date) {
            const dateObj = new Date(plan.date + "T00:00:00");
            dateText = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        }

        const timeText = plan.time ? ` ⏰ ${plan.time}` : "";

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
                        ${isDone ? '✅ Realizado' : 'Marcar como hecho'}
                    </label>
                </div>

                <div class="card-header" style="margin-bottom: 6px;">
                    <span class="badge-category">${cat.icon} ${cat.name} ${dateText}${timeText}</span>
                </div>

                <h3 style="margin: 4px 0 8px 0; font-size: 17px; ${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${escapeHTML(plan.title)}</h3>
                ${plan.location_name ? `<div style="font-size: 13px; color: var(--muted); margin-top: 4px;">📍 ${escapeHTML(plan.location_name)}</div>` : ''}
                ${plan.description ? `<p style="font-size: 13px; margin-top: 6px; opacity: 0.8;">${escapeHTML(plan.description)}</p>` : ''}
            </div>
        `;
    }).join("");
}

window.togglePlanCompleted = async function(id, isChecked) {
    const plan = state.plans.find(p => p.id == id);
    if (plan) {
        plan.completed = isChecked;
        renderPlans();
    }

    if (supabaseApp) {
        const { error } = await supabaseApp
            .from("plans")
            .update({ completed: isChecked })
            .eq("id", id);

        if (error) {
            console.error("Error actualizando estado completado:", error);
            if (plan) plan.completed = !isChecked;
            renderPlans();
        }
    }
};

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
    const filterBtns = document.querySelectorAll("[data-plan-filter]");
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
        .filter(p => !p.completed && p.date && p.date >= today)
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
        listEl.innerHTML = `<div class="empty-state">No hay reservas registradas.</div>`;
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
                <strong>${escapeHTML(e.title)}</strong>
                <span class="badge-amount">${e.amount} ${e.currency}</span>
            </div>
            <p>Pagó: <strong>${escapeHTML(e.paid_by)}</strong></p>
            <small>Para: ${e.participants ? e.participants.map(p => escapeHTML(p)).join(", ") : "Todos"}</small>
        </div>
    `).join("");
}

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
   MAPA LEAFLET
   ========================================================================== */
function initOrRefreshMap() {
    if (typeof L === 'undefined') return;

    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    if (!state.map) {
        state.map = L.map("map").setView([state.hotel.lat, state.hotel.lng], 13);
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

    state.plans.forEach(plan => {
        const lat = parseFloat(plan.latitude);
        const lng = parseFloat(plan.longitude);

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            const emoji = getCategoryIcon(plan.category ? plan.category.toLowerCase() : 'other');

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

    if (bounds.length > 0) {
        state.map.fitBounds(bounds, { padding: [40, 40] });
    }
}
    --text: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
    --primary: #111827;
    --accent: #2563eb;
    --danger: #dc2626;
    --success: #15803d;
}

html,
body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
}

body {
    padding-bottom: 82px;
}

button,
input,
textarea,
select {
    font: inherit;
}

button {
    cursor: pointer;
}

a {
    color: var(--accent);
    text-decoration: none;
}

#app {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
}

/* ==========================================
   CABECERA
========================================== */

.app-header {
    background: #111827;
    color: white;
    padding:
        calc(18px + env(safe-area-inset-top))
        20px
        20px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}

.app-header h1 {
    margin: 0;
    font-size: 25px;
}

.app-header p {
    margin: 5px 0 0;
    opacity: .72;
    font-size: 13px;
}

.connection-status {
    font-size: 11px;
    white-space: nowrap;
    opacity: .8;
}

.connection-status.ok {
    color: #86efac;
}

.connection-status.error {
    color: #fca5a5;
}

/* ==========================================
   PANTALLAS
========================================== */

main {
    min-height: calc(100vh - 80px);
}

.screen {
    display: none;
    padding: 18px 16px 30px;
}

.screen.active {
    display: block;
}

/* ==========================================
   HERO
========================================== */

.hero-card {
    background:
        linear-gradient(
            135deg,
            #111827,
            #273449
        );

    color: white;

    border-radius: 22px;

    padding: 22px;

    display: flex;
    justify-content: space-between;
    gap: 15px;

    box-shadow:
        0 10px 25px rgba(0,0,0,.12);
}

.small-label {
    display: block;
    font-size: 11px;
    opacity: .7;
    letter-spacing: .08em;
    margin-bottom: 6px;
}

.hero-card strong {
    display: block;
    font-size: 22px;
}

.hero-card p {
    margin: 8px 0 0;
    font-size: 12px;
    opacity: .7;
}

.hero-location {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    font-size: 13px;
}

/* ==========================================
   WEATHER & CURRENCY
========================================== */

.weather-card,
.currency-card {
    margin-top: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 16px;
}

.weather-main {
    display: flex;
    align-items: center;
    gap: 13px;
}

.weather-main > span {
    font-size: 35px;
}

.weather-main strong {
    display: block;
    font-size: 25px;
}

.weather-main span {
    color: var(--muted);
    font-size: 12px;
}

.weather-extra {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    color: var(--muted);
    font-size: 12px;
}

.currency-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.currency-card strong {
    display: block;
}

.currency-card > span {
    font-size: 18px;
    font-weight: 700;
}

/* ==========================================
   SECCIONES
========================================== */

.section-heading {
    margin: 25px 2px 10px;
}

.section-heading.compact {
    margin-top: 20px;
}

.section-heading h2 {
    margin: 0;
    font-size: 15px;
}

/* ==========================================
   TARJETAS
========================================== */

.next-card,
.info-card,
.activity-card,
.reservation-card,
.expense-card,
.flight-card,
.debt-card,
.balance-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 17px;
    padding: 16px;
}

.next-card {
    display: flex;
    gap: 14px;
    align-items: center;
}

.next-card > span {
    font-size: 30px;
}

.next-card strong {
    display: block;
}

.next-card p,
.info-card p,
.activity-card p,
.reservation-card p,
.expense-card p,
.flight-card p {
    color: var(--muted);
    margin: 5px 0 0;
    font-size: 13px;
}

/* ==========================================
   ACCIONES
========================================== */

.quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
    margin-top: 12px;
}

.quick-button {
    border: 1px solid var(--border);
    background: white;
    border-radius: 16px;
    padding: 14px 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--text);
}

.quick-button span {
    font-size: 25px;
}

.quick-button strong {
    font-size: 11px;
}

/* ==========================================
   VIAJERAS
========================================== */

.travelers-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.traveler-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 17px 8px;
    text-align: center;
}

.traveler-card span {
    display: block;
    font-size: 30px;
    margin-bottom: 6px;
}

/* ==========================================
   INFO
========================================== */

.info-card {
    display: flex;
    gap: 13px;
}

.info-icon {
    font-size: 30px;
}

/* ==========================================
   TITULO PANTALLA
========================================== */

.screen-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
}

.screen-title > div:first-child {
    display: flex;
    align-items: center;
    gap: 12px;
}

.screen-title > div:first-child > span {
    font-size: 28px;
}

.screen-title h2 {
    margin: 0;
    font-size: 21px;
}

.screen-title p {
    margin: 3px 0 0;
    color: var(--muted);
    font-size: 12px;
}

/* ==========================================
   BOTONES
========================================== */

.primary-button,
.secondary-button {
    border: 0;
    border-radius: 12px;
    padding: 11px 15px;
    font-weight: 700;
}

.primary-button {
    background: var(--primary);
    color: white;
}

.secondary-button {
    background: #eef2ff;
    color: #3730a3;
}

.primary-button.full {
    width: 100%;
    margin-top: 10px;
}

.danger-button {
    border: 0;
    background: #fee2e2;
    color: var(--danger);
    border-radius: 10px;
    padding: 8px 11px;
}

/* ==========================================
   LISTAS
========================================== */

.list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.activity-card,
.reservation-card,
.expense-card,
.flight-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.card-main {
    min-width: 0;
    flex: 1;
}

.card-actions {
    display: flex;
    align-items: flex-start;
}

.date-badge {
    flex: 0 0 60px;
    background: #f3f4f6;
    border-radius: 12px;
    text-align: center;
    padding: 8px 4px;
}

.date-badge strong {
    display: block;
    font-size: 17px;
}

.date-badge span {
    font-size: 10px;
    color: var(--muted);
}

.type-badge {
    display: inline-block;
    padding: 4px 7px;
    background: #f3f4f6;
    border-radius: 7px;
    font-size: 10px;
    margin-bottom: 6px;
}

/* ==========================================
   GASTOS
========================================== */

.expense-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.balance-card {
    padding: 13px 8px;
    text-align: center;
}

.balance-card span {
    display: block;
    color: var(--muted);
    font-size: 11px;
}

.balance-card strong {
    display: block;
    margin-top: 5px;
    font-size: 16px;
}

.positive {
    color: var(--success);
}

.negative {
    color: var(--danger);
}

.debts {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.debt-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.debt-card strong {
    font-size: 14px;
}

.debt-amount {
    font-weight: 800;
}

/* ==========================================
   VUELOS
========================================== */

.flight-route {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 9px 0;
}

.flight-airport {
    font-weight: 800;
    font-size: 20px;
}

.flight-arrow {
    color: var(--muted);
}

/* ==========================================
   MÁS
========================================== */

.more-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.more-card {
    border: 1px solid var(--border);
    background: white;
    border-radius: 17px;
    padding: 20px 14px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.more-card:first-child {
    font-size: 27px;
}

.more-card strong {
    font-size: 15px;
}

.more-card span {
    color: var(--muted);
    font-size: 11px;
}

/* ==========================================
   MAPA
========================================== */

.map-screen {
    padding-left: 0;
    padding-right: 0;
}

.map-screen .screen-title {
    padding: 0 16px;
}

#map {
    width: 100%;
    height: 60vh;
    min-height: 420px;
}

.map-list {
    padding: 12px 16px 20px;
}

.map-item {
    background: white;
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 12px;
    margin-bottom: 8px;
}

.map-item strong {
    display: block;
}

.map-item span {
    display: block;
    color: var(--muted);
    font-size: 11px;
    margin-top: 3px;
}

/* ==========================================
   MODALES
========================================== */

.modal {
    position: fixed;
    inset: 0;
    z-index: 5000;
    background: rgba(0,0,0,.55);
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.modal.hidden {
    display: none;
}

.modal-content {
    width: 100%;
    max-width: 760px;
    max-height: 92vh;
    overflow-y: auto;
    background: white;
    border-radius: 22px 22px 0 0;
    padding: 20px 17px 30px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.modal-header h2 {
    margin: 0;
    font-size: 20px;
}

.close-modal {
    border: 0;
    background: #f3f4f6;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    font-size: 23px;
}

/* ==========================================
   FORMULARIOS
========================================== */

form {
    display: flex;
    flex-direction: column;
    gap: 13px;
}

label,
fieldset legend {
    font-size: 12px;
    font-weight: 700;
}

input,
textarea,
select {
    display: block;
    width: 100%;
    margin-top: 6px;
    border: 1px solid #d1d5db;
    border-radius: 11px;
    padding: 12px;
    background: white;
    color: var(--text);
}

textarea {
    min-height: 80px;
    resize: vertical;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

fieldset {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
}

.check-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-weight: 500;
}

.check-label input {
    width: auto;
    margin: 0;
}

/* Sugerencias de Autocompletado Gratis (Nominatim/OSM) */
#nominatim-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border);
    border-radius: 12px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 6000;
    box-shadow: 0 10px 20px rgba(0,0,0,0.12);
    margin-top: 4px;
}

.suggestion-item {
    padding: 11px 14px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid #f3f4f6;
    color: var(--text);
    transition: background-color 0.15s ease;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item:active {
    background-color: #f3f4f6;
}

.search-results {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.search-result {
    border: 1px solid var(--border);
    background: #f9fafb;
    border-radius: 10px;
    padding: 10px;
    text-align: left;
}

.search-result strong {
    display: block;
}

.search-result span {
    display: block;
    color: var(--muted);
    font-size: 11px;
    margin-top: 3px;
}

/* ==========================================
   VACÍO / CARGANDO
========================================== */

.empty {
    text-align: center;
    color: var(--muted);
    padding: 30px 15px;
    background: white;
    border: 1px dashed var(--border);
    border-radius: 16px;
}

.loading {
    color: var(--muted);
}

/* ==========================================
   NAVEGACIÓN INFERIOR
========================================== */

.bottom-nav {
    position: fixed;
    z-index: 4000;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 760px;
    background: rgba(255,255,255,.97);
    border-top: 1px solid var(--border);
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding:
        7px
        7px
        calc(7px + env(safe-area-inset-bottom));
    backdrop-filter: blur(12px);
}

.nav-button {
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 6px 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}

.nav-button span {
    font-size: 21px;
}

.nav-button small {
    font-size: 9px;
}

.nav-button.active {
    color: var(--accent);
    font-weight: 800;
}

/* ==========================================
   FILTROS DEL PLAN
========================================== */

.plan-filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 12px;
    margin-bottom: 8px;
    scrollbar-width: none;
}

.plan-filters::-webkit-scrollbar {
    display: none;
}

.plan-filter {
    flex: 0 0 auto;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #374151;
    border-radius: 999px;
    padding: 9px 13px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.plan-filter.active {
    background: #111827;
    color: #ffffff;
    border-color: #111827;
}

.plan-filter:active {
    transform: scale(0.97);
}

/* ==========================================
   MÓVIL
========================================== */

@media (max-width: 480px) {

    .quick-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .hero-card {
        flex-direction: column;
    }

    .hero-location {
        align-items: flex-start;
    }

    .screen-title {
        align-items: flex-start;
    }

    .screen-title .primary-button {
        padding: 9px 11px;
        font-size: 12px;
    }

}
