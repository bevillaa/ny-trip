/* ==========================================================================
   🗽 NY TRIP 
   ========================================================================== */

// Configuración de Supabase
const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YnJuYnlvc3J0eGVheXFtdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUwODQsImV4cCI6MjEwMjAzMTA4NH0.W3mCe1yAehFd0bz_XNVJ83YR-dNz-8VZnnhgj-cQEss";

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
        console.error("No se pudo inicializar Supabase.");
        updateConnectionStatus(false);
        showLoginScreen();
    }

    updateWeather();
    updateCurrency();
}

/* ==========================================================================
   ESTADO DE CONEXIÓN
   ========================================================================== */
function updateConnectionStatus(isConnected) {
    const el = document.getElementById("connection-status");
    if (!el) return;

    if (isConnected) {
        el.textContent = "● Conectado";
        el.className = "connection-status ok";
    } else {
        el.textContent = "● Sin conexión";
        el.className = "connection-status error";
    }
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

    const spainTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const nyTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const clocksEl = document.getElementById("header-clocks");
    if (clocksEl) {
        clocksEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700;">
                <span>🗽 NY:</span> <strong>${nyTimeStr}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; opacity: 0.85;">
                <span>💃 España:</span> <strong>${spainTimeStr}</strong>
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
   CARGA Y SINCRONIZACIÓN DE DATOS
   ========================================================================== */
async function loadAllData() {
    if (!supabaseApp) {
        updateConnectionStatus(false);
        return;
    }

    try {
        const [plansRes, resRes, expRes] = await Promise.all([
            supabaseApp.from("plans").select("*"),
            supabaseApp.from("reservations").select("*"),
            supabaseApp.from("expenses").select("*")
        ]);

        if (plansRes.error || resRes.error || expRes.error) {
            updateConnectionStatus(false);
        } else {
            updateConnectionStatus(true);
        }

        if (plansRes.data) state.plans = plansRes.data;
        if (resRes.data) state.reservations = resRes.data;
        if (expRes.data) state.expenses = expRes.data;

        renderAll();
    } catch (err) {
        console.error("Error al cargar datos:", err);
        updateConnectionStatus(false);
    }
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
   MODAL DE INFORMACIÓN DETALLADA POR INTEGRANTE DEL EQUIPO
   ========================================================================== */
window.openMemberDetails = function(name) {
    const modal = document.getElementById("member-modal");
    const titleEl = document.getElementById("member-modal-title");
    const bodyEl = document.getElementById("member-modal-body");

    if (!modal || !bodyEl) return;

    const memberIcons = {
        'Sara': '😇',
        'Laura': '😈',
        'Belén': '🤪'
    };

    const icon = memberIcons[name] || '👤';
    titleEl.textContent = `${icon} Resumen de ${name}`;

    // Gastos pagados por esta persona
    const paidByMember = state.expenses.filter(e => e.paid_by && e.paid_by.toLowerCase() === name.toLowerCase());
    
    // Gastos en los que participa esta persona
    const participatedIn = state.expenses.filter(e => e.participants && e.participants.some(p => p.toLowerCase() === name.toLowerCase()));

    let totalPaidEUR = 0;
    let totalPaidUSD = 0;

    paidByMember.forEach(e => {
        if (e.currency === 'USD') totalPaidUSD += Number(e.amount);
        else totalPaidEUR += Number(e.amount);
    });

    let html = `
        <div style="background: #f8fafc; padding: 14px; border-radius: 14px; border: 1px solid var(--border); margin-bottom: 16px;">
            <strong style="display: block; font-size: 14px; margin-bottom: 4px;">💳 Total Pagado por ${name}:</strong>
            <div style="font-size: 18px; font-weight: 800; color: var(--accent);">
                ${totalPaidEUR.toFixed(2)} € / $${totalPaidUSD.toFixed(2)} USD
            </div>
            <small style="color: var(--muted);">${paidByMember.length} pago(s) registrados</small>
        </div>

        <h3 style="font-size: 15px; margin: 12px 0 8px 0;">🧾 Gastos Abonados</h3>
    `;

    if (paidByMember.length === 0) {
        html += `<p style="color: var(--muted); font-size: 13px;">No ha pagado ningún gasto aún.</p>`;
    } else {
        html += `<div class="list" style="margin-bottom: 16px;">`;
        paidByMember.forEach(e => {
            html += `
                <div style="background: white; border: 1px solid var(--border); padding: 10px 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; font-size: 13px;">${escapeHTML(e.title)}</strong>
                        <small style="color: var(--muted); font-size: 11px;">${e.date || 'Sin fecha'} — Para: ${e.participants ? e.participants.join(", ") : "Todos"}</small>
                    </div>
                    <span style="font-weight: 700; font-size: 13px;">${e.amount} ${e.currency}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `<h3 style="font-size: 15px; margin: 12px 0 8px 0;">📌 Participa en (${participatedIn.length}) Gastos</h3>`;
    if (participatedIn.length === 0) {
        html += `<p style="color: var(--muted); font-size: 13px;">No participa en ningún gasto activo.</p>`;
    } else {
        html += `<div class="list">`;
        participatedIn.forEach(e => {
            html += `
                <div style="background: white; border: 1px solid var(--border); padding: 10px 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; font-size: 13px;">${escapeHTML(e.title)}</strong>
                        <small style="color: var(--muted); font-size: 11px;">Pagado por: <strong>${escapeHTML(e.paid_by)}</strong></small>
                    </div>
                    <span style="font-weight: 700; font-size: 13px; color: var(--muted);">${e.amount} ${e.currency}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    bodyEl.innerHTML = html;
    openModal("member-modal");
};

/* ==========================================================================
   NAVEGACIÓN Y MODALES
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
   FORMULARIO Y FUNCIONALIDADES SECUNDARIAS
   ========================================================================== */
function setupForms() {
    document.getElementById("plan-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const id = document.getElementById("plan-id").value;
            const titleVal = document.getElementById("plan-title").value.trim();
            const dateVal = document.getElementById("plan-date").value;
            const locInput = document.getElementById("plan-location");
            const locationText = locInput ? locInput.value.trim() : "";

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

            if (!supabaseApp) throw new Error("Sin conexión a Supabase");

            if (id) {
                await supabaseApp.from("plans").update(planData).eq("id", id);
            } else {
                await supabaseApp.from("plans").insert([planData]);
            }

            closeModal("plan-modal");
            await loadAllData();

        } catch (err) {
            alert("⚠️ No se pudo guardar el plan: " + err.message);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
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

function renderPlans() {
    const listEl = document.getElementById("plan-list");
    if (!listEl) return;

    let filtered = state.plans;

    if (state.activePlanFilter !== 'all') {
        filtered = filtered.filter(p => {
            if (!p.category) return state.activePlanFilter === 'other';
            const cat = p.category.toString().trim().toLowerCase();
            const filter = state.activePlanFilter.toLowerCase();
            return cat === filter;
        });
    }

    if (!filtered || filtered.length === 0) {
        listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted);">No hay planes en esta categoría.</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(plan => {
        const catKey = plan.category ? plan.category.toString().trim().toLowerCase() : 'other';
        const cat = CATEGORIES[catKey] || CATEGORIES.other;
        const isDone = !!plan.completed;

        return `
            <div class="card plan-card ${isDone ? 'is-completed' : ''}">
                <div class="card-actions">
                    <button class="icon-button" onclick="editPlan('${plan.id}')" title="Editar">✏️</button>
                    <button class="icon-button danger" onclick="deletePlan('${plan.id}')" title="Borrar">🗑️</button>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span class="badge-category">${cat.icon} ${cat.name}</span>
                </div>

                <h3 style="margin: 4px 0 8px 0; font-size: 17px;">${escapeHTML(plan.title)}</h3>
                ${plan.location_name ? `<div style="font-size: 13px; color: var(--muted);">📍 ${escapeHTML(plan.location_name)}</div>` : ''}
                ${plan.description ? `<p style="font-size: 13px; margin-top: 6px;">${escapeHTML(plan.description)}</p>` : ''}
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
    if (supabaseApp) await supabaseApp.from("plans").delete().eq("id", id);
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

    if (state.plans.length > 0) {
        const next = state.plans[0];
        nextEl.innerHTML = `
            <span>📅</span>
            <div>
                <strong>${escapeHTML(next.title)}</strong>
                <p>${next.location_name ? escapeHTML(next.location_name) : 'Nueva York'}</p>
            </div>
        `;
    } else {
        nextEl.innerHTML = `
            <span>🗽</span>
            <div>
                <strong>¡Sin actividades próximas!</strong>
                <p>Añade vuestro primer plan para verlo aquí.</p>
            </div>
        `;
    }
}

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
        listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted);">No hay reservas registradas.</div>`;
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
        listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted);">No hay gastos registrados.</div>`;
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${escapeHTML(e.title)}</strong>
                <span style="font-weight: 800;">${e.amount} ${e.currency}</span>
            </div>
            <p style="margin: 4px 0 0; font-size: 12px; color: var(--muted);">Pagó: <strong>${escapeHTML(e.paid_by)}</strong></p>
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
        <div class="card">
            <h3>🏨 ${escapeHTML(h.name)}</h3>
            <p>📍 ${escapeHTML(h.address)}</p>
            <small>📅 Entrada: ${escapeHTML(h.checkIn)} | Salida: ${escapeHTML(h.checkOut)}</small>
        </div>
    `;
}

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
            .bindPopup(`<b>🏨 ${escapeHTML(state.hotel.name)}</b>`);
        
        state.markers.push(hotelMarker);
    }

    if (bounds.length > 0) {
        state.map.fitBounds(bounds, { padding: [40, 40] });
    }
}

function setupLocationSearch() {}
async function geocodeAddress(query) { return { lat: 40.7128, lng: -74.0060 }; }

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
