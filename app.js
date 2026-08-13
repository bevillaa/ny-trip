/* ==========================================================================
   🗽 NY TRIP - APP.JS (Diagnóstico directo)
   ========================================================================== */

console.log("🚀 app.js cargado correctamente");

const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YnJuYnlvc3J0eGVheXFtdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTUwODQsImV4cCI6MjEwMjAzMTA4NH0.W3mCe1yAehFd0bz_XNVJ83YR-dNz-8VZnnhgj-cQEss";

var supabaseApp = null;
if (window.supabase) {
    supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase inicializado");
} else {
    console.error("❌ No se encontró la librería de Supabase en window.supabase");
}

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
    sweet: { name: "Dulces", icon: "🍪" },
    activity: { name: "Spots", icon: "📍" },
    shopping: { name: "Tiendas", icon: "🛍️" },
    sightseeing: { name: "Turisteo", icon: "🗽" },
    other: { name: "Otros", icon: "📌" }
};

function getCategoryIcon(category) {
    if (!category) return "📌";
    const key = category.toString().trim().toLowerCase();
    return CATEGORIES[key] ? CATEGORIES[key].icon : "📌";
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM Cargado. Inicializando App...");
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
            console.log("Auth State Change:", event);
            if (session && session.user) {
                handleLoginSuccess(session.user);
            } else if (event === 'SIGNED_OUT') {
                showLoginScreen();
            }
        });

        try {
            const { data: { session } } = await supabaseApp.auth.getSession();
            if (session && session.user) {
                console.log("Sesión activa encontrada:", session.user.email);
                handleLoginSuccess(session.user);
            } else {
                console.log("Sin sesión activa. Mostrando Login.");
                showLoginScreen();
            }
        } catch (e) {
            console.error("Error al obtener sesión:", e);
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }

    updateWeather();
    updateCurrency();
}

function showLoginScreen() {
    document.getElementById("login-screen")?.classList.remove("hidden");
    document.getElementById("login-screen")?.removeAttribute("hidden");
    document.getElementById("app")?.classList.add("hidden");
}

function hideLoginScreen() {
    document.getElementById("login-screen")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
    document.getElementById("app")?.removeAttribute("hidden");
}

function handleLoginSuccess(user) {
    state.currentUser = user;
    const userEmailEl = document.getElementById("current-user-email");
    if (userEmailEl) userEmailEl.textContent = user.email || "Viajero";
    hideLoginScreen();
    loadAllData();
}

function setupForms() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        console.log("✅ Formulario de login vinculado");
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("🔑 Intentando login...");
            
            const email = document.getElementById("login-email")?.value.trim();
            const password = document.getElementById("login-password")?.value.trim();
            const errorDiv = document.getElementById("login-error");
            const submitBtn = document.getElementById("login-submit-btn");

            if (errorDiv) {
                errorDiv.hidden = true;
                errorDiv.textContent = "";
            }

            if (!supabaseApp) {
                alert("Error: Supabase no está cargado.");
                return;
            }

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Cargando...";
                }

                const { data, error } = await supabaseApp.auth.signInWithPassword({ email, password });

                if (error) {
                    console.warn("⚠️ Error devuelto por Supabase:", error.message);
                    if (errorDiv) {
                        errorDiv.textContent = "Error: " + error.message;
                        errorDiv.hidden = false;
                    } else {
                        alert("Error: " + error.message);
                    }
                } else if (data && data.user) {
                    console.log("✅ Login exitoso para:", data.user.email);
                    handleLoginSuccess(data.user);
                }
            } catch (err) {
                console.error("💥 Error crítico en submit login:", err);
                alert("Error de conexión al intentar iniciar sesión.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Iniciar Sesión";
                }
            }
        });
    } else {
        console.error("❌ No se encontró el elemento #login-form en la página");
    }

    document.getElementById("logout-button")?.addEventListener("click", async () => {
        if (supabaseApp) await supabaseApp.auth.signOut();
        state.currentUser = null;
        showLoginScreen();
    });

    document.getElementById("plan-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("plan-id").value;
        const titleVal = document.getElementById("plan-title").value.trim();
        const planData = {
            title: titleVal,
            category: document.getElementById("plan-category").value || "other",
            description: document.getElementById("plan-description").value || null,
            date: document.getElementById("plan-date").value || null,
            time: document.getElementById("plan-time").value || null,
            location_name: document.getElementById("plan-location").value || null,
            created_by: state.currentUser ? state.currentUser.email : "invitado"
        };

        if (supabaseApp) {
            if (id) await supabaseApp.from("plans").update(planData).eq("id", id);
            else await supabaseApp.from("plans").insert([planData]);
        }
        closeModal("plan-modal");
        loadAllData();
    });

    document.getElementById("expense-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const expData = {
            title: document.getElementById("expense-title").value,
            amount: parseFloat(document.getElementById("expense-amount").value),
            currency: document.getElementById("expense-currency").value,
            paid_by: document.getElementById("expense-paid-by").value,
            date: document.getElementById("expense-date").value || new Date().toISOString().split("T")[0]
        };
        if (supabaseApp) await supabaseApp.from("expenses").insert([expData]);
        closeModal("expense-modal");
        loadAllData();
    });
}

function startClocksAndCountdown() {
    updateClocksAndCountdown();
    setInterval(updateClocksAndCountdown, 1000);
}

function updateClocksAndCountdown() {
    const now = new Date();
    const malagaTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' });
    const nyTimeStr = now.toLocaleTimeString('es-ES', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });

    const clocksEl = document.getElementById("header-clocks");
    if (clocksEl) {
        clocksEl.innerHTML = `<span>🗽 ${nyTimeStr}</span> | <span>💃 ${malagaTimeStr}</span>`;
    }

    const dayEl = document.getElementById("trip-day");
    if (dayEl) {
        const startDate = new Date(2026, 11, 26);
        const diffDays = Math.round((startDate - now) / (1000 * 60 * 60 * 24));
        dayEl.textContent = diffDays > 0 ? `Faltan ${diffDays} días` : "¡En NY!";
    }
}

function setupLocationSearch() {}
async function loadAllData() {
    if (!supabaseApp) return;
    const [plansRes, resRes, expRes] = await Promise.all([
        supabaseApp.from("plans").select("*"),
        supabaseApp.from("reservations").select("*"),
        supabaseApp.from("expenses").select("*")
    ]);
    if (plansRes.data) state.plans = plansRes.data;
    if (resRes.data) state.reservations = resRes.data;
    if (expRes.data) state.expenses = expRes.data;
    renderAll();
}

function renderAll() {
    renderPlans();
    renderExpenses();
    renderReservations();
    renderFlights();
    renderHotel();
}

function setupNavigation() {
    document.querySelectorAll("[data-screen]").forEach(btn => {
        btn.addEventListener("click", () => switchScreen(btn.getAttribute("data-screen")));
    });
}

function switchScreen(screenName) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));
    document.getElementById(`screen-${screenName}`)?.classList.add("active");
    document.querySelector(`.bottom-nav .nav-button[data-screen="${screenName}"]`)?.classList.add("active");
    if (screenName === 'map') initOrRefreshMap();
}

function setupModals() {
    document.getElementById("open-plan-form")?.addEventListener("click", () => openModal("plan-modal"));
    document.getElementById("open-expense-form")?.addEventListener("click", () => openModal("expense-modal"));
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
    });
}

function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function setupFilters() {}
function renderPlans() {
    const listEl = document.getElementById("plan-list");
    if (!listEl) return;
    if (state.plans.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No hay planes.</div>`;
        return;
    }
    listEl.innerHTML = state.plans.map(p => `
        <div class="card">
            <h3>${p.title}</h3>
            <p>${p.description || ''}</p>
        </div>
    `).join('');
}

function renderNextActivity() {}
async function updateWeather() {}
async function updateCurrency() {}
function renderReservations() {}
function renderExpenses() {}
function renderFlights() {}
function renderHotel() {}
function initOrRefreshMap() {}
