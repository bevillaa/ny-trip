// ==========================================
// 🗽 NY TRIP — APLICACIÓN COMPLETA
// ==========================================

const SUPABASE_URL = "https://rtbrnbyosrtxeayqmvwc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xvstsFi5T_bbgYb-9qiJ6A_y8OrALEA";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

const TRAVELERS = ["Laura", "Sara", "Belén"];
const TRAVELER_EMOJIS = { Laura: "😈", Sara: "😇", Belén: "🤪" };
const TRIP_START = new Date("2026-12-26T00:00:00");
const TRIP_END = new Date("2027-01-04T23:59:59");

const flights = [
    { flightNumber: "EI583", airline: "Aer Lingus", from: "AGP", to: "DUB", date: "2026-12-26", departure: "12:30", arrival: "14:45", duration: "3h 15m" },
    { flightNumber: "EI107", airline: "Aer Lingus", from: "DUB", to: "JFK", date: "2026-12-26", departure: "16:45", arrival: "19:25", duration: "7h 40m" },
    { flightNumber: "EI104", airline: "Aer Lingus", from: "JFK", to: "DUB", date: "2027-01-04", departure: "17:00", arrival: "04:20", duration: "6h 20m" },
    { flightNumber: "EI582", airline: "Aer Lingus", from: "DUB", to: "AGP", date: "2027-01-05", departure: "07:10", arrival: "11:20", duration: "3h 10m" }
];

const HOTEL = {
    name: "Courtyard by Marriott New York Manhattan Upper East Side",
    address: "Nueva York, Estados Unidos",
    latitude: 40.7744,
    longitude: -73.9500,
    bookingUrl: "https://www.booking.com/hotel/us/manhattan-upper-east-side-courtyard-by-marriott.es.html"
};

let plans = [];
let reservations = [];
let expenses = [];
let places = [];

let map = null;
let mapMarkers = [];
let googleAutocomplete = null;
let selectedPlanLocation = null;

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(amount, currency) {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: currency || "EUR"
    }).format(Number(amount) || 0);
}

function formatDate(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(`${date}T00:00:00`));
}

function getDateTimestamp(date, time) {
    if (!date) return Number.MAX_SAFE_INTEGER;
    return new Date(`${date}T${time || "00:00"}:00`).getTime();
}

// LOGIN
function showLogin() {
    document.getElementById("login-screen")?.removeAttribute("hidden");
    document.getElementById("app")?.setAttribute("hidden", "true");
}

function showApp() {
    document.getElementById("login-screen")?.setAttribute("hidden", "true");
    document.getElementById("app")?.removeAttribute("hidden");
}

function setLoginError(message) {
    const el = document.getElementById("login-error");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
}

function setLoginLoading(loading) {
    const btn = document.getElementById("login-button");
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Entrando..." : "Entrar";
}

async function loginUser(email, password) {
    setLoginError("");
    setLoginLoading(true);
    try {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await enterApplication(data.session);
    } catch (error) {
        setLoginError(error.message || "Error al iniciar sesión.");
    } finally {
        setLoginLoading(false);
    }
}

async function logoutUser() {
    try {
        await db.auth.signOut();
        plans = []; reservations = []; expenses = []; places = [];
        showLogin();
    } catch (error) {
        alert("No se pudo cerrar sesión");
    }
}

async function checkAuthentication() {
    try {
        const { data } = await db.auth.getSession();
        if (data?.session) {
            await enterApplication(data.session);
            return true;
        }
    } catch (e) {}
    showLogin();
    return false;
}

async function enterApplication(session) {
    showApp();
    const userElement = document.getElementById("current-user-email");
    if (userElement) userElement.textContent = session.user?.email || "Usuario";
    
    updateTripDay();
    renderFlights();
    initGoogleMapsAutocomplete();
    await loadWeather();
    await loadCurrency();
    await loadData();
}

function setupAuthentication() {
    document.getElementById("login-form")?.addEventListener("submit", async e => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        if (email && password) await loginUser(email, password);
    });
    document.getElementById("logout-button")?.addEventListener("click", logoutUser);
}

function setConnectionStatus(text, state = "") {
    const el = document.getElementById("connection-status");
    if (el) {
        el.textContent = text;
        el.className = "connection-status " + state;
    }
}

function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(`screen-${name}`)?.classList.add("active");
    document.querySelectorAll(".nav-button").forEach(b => b.classList.toggle("active", b.dataset.screen === name));

    if (name === "map") {
        setTimeout(() => {
            initializeMap();
            if (map) { map.invalidateSize(); renderMap(); }
        }, 100);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", e => {
    const btn = e.target.closest("[data-screen]");
    if (btn) showScreen(btn.dataset.screen);
});

function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

document.addEventListener("click", e => {
    const btn = e.target.closest("[data-close]");
    if (btn) closeModal(btn.dataset.close);
});

// INICIALIZACIÓN CONTROLADA DE GOOGLE MAPS AUTOCOMPLETE
function initGoogleMapsAutocomplete() {
    const input = document.getElementById("plan-location");
    if (!input) return;

    // Si Google Maps falla o no tiene clave válida, el input funcionará de forma normal sin bloquearse
    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
        console.warn("Google Maps Places API no está lista o falta la clave. Se usará el modo texto estándar.");
        return;
    }

    try {
        const options = {
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(40.477399, -74.25909),
                new google.maps.LatLng(40.917577, -73.700272)
            ),
            fields: ["name", "formatted_address", "geometry", "url"]
        };

        googleAutocomplete = new google.maps.places.Autocomplete(input, options);

        googleAutocomplete.addListener("place_changed", () => {
            const place = googleAutocomplete.getPlace();
            if (!place || !place.geometry || !place.geometry.location) {
                selectedPlanLocation = null;
                return;
            }

            selectedPlanLocation = {
                name: place.name || place.formatted_address,
                address: place.formatted_address,
                lat: place.geometry.location.lat(),
                lon: place.geometry.location.lng(),
                url: place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || place.formatted_address)}`
            };
        });
    } catch (err) {
        console.error("Error al inicializar Autocomplete de Google Maps:", err);
    }
}

// BOTONES Y MODALES
document.getElementById("open-plan-form")?.addEventListener("click", () => {
    document.getElementById("plan-form")?.reset();
    selectedPlanLocation = null;
    openModal("plan-modal");
});

document.getElementById("open-reservation-form")?.addEventListener("click", () => {
    document.getElementById("reservation-form")?.reset();
    openModal("reservation-modal");
});

document.getElementById("open-expense-form")?.addEventListener("click", () => {
    document.getElementById("expense-form")?.reset();
    document.querySelectorAll('input[name="participant"]').forEach(i => i.checked = true);
    openModal("expense-modal");
});

function updateTripDay() {
    const el = document.getElementById("trip-day");
    if (!el) return;
    const today = new Date();
    today.setHours(0,0,0,0);

    if (today < TRIP_START) {
        const diff = Math.ceil((TRIP_START - today) / (1000 * 60 * 60 * 24));
        el.textContent = `FALTAN ${diff} DÍAS`;
    } else if (today <= TRIP_END) {
        const day = Math.floor((today - TRIP_START) / (1000 * 60 * 60 * 24)) + 1;
        el.textContent = `DÍA ${day}`;
    } else {
        el.textContent = "VIAJE FINALIZADO";
    }
}

async function loadWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code,wind_speed_10m&timezone=America%2FNew_York");
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById("weather-temperature").textContent = `${Math.round(data.current.temperature_2m)}°C`;
        document.getElementById("weather-wind").textContent = `Viento ${Math.round(data.current.wind_speed_10m)} km/h`;
        document.getElementById("weather-description").textContent = "Nueva York";
    } catch (e) {}
}

async function loadCurrency() {
    try {
        const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD");
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById("currency-value").textContent = `${data.rates.USD.toFixed(4)} $`;
    } catch (e) {}
}

async function loadData() {
    setConnectionStatus("● Sincronizando...");
    try {
        const [p, r, e, pl] = await Promise.all([
            db.from("plans").select("*").order("date", { ascending: true }),
            db.from("reservations").select("*").order("date", { ascending: true }),
            db.from("expenses").select("*").order("date", { ascending: false }),
            db.from("places").select("*")
        ]);

        plans = p.data || [];
        reservations = r.data || [];
        expenses = e.data || [];
        places = pl.data || [];

        setConnectionStatus("● Conectada", "ok");
        renderAll();
    } catch (error) {
        setConnectionStatus("● Error de conexión", "error");
    }
}

function renderAll() {
    renderNextActivity();
    renderPlans();
    renderReservations();
    renderExpenses();
    renderFlights();
    renderMap();
}

function renderNextActivity() {
    const element = document.getElementById("next-activity");
    if (!element) return;
    const all = [...plans, ...reservations].filter(i => i.date).sort((a,b) => getDateTimestamp(a.date, a.time) - getDateTimestamp(b.date, b.time));
    
    if (!all.length) {
        element.innerHTML = `<span>📅</span><div><strong>Aún no hay actividades</strong><p>Añade vuestro primer plan.</p></div>`;
        return;
    }
    const next = all[0];
    element.innerHTML = `<span>📍</span><div><strong>${escapeHTML(next.title)}</strong><p>${formatDate(next.date)} ${next.time ? '· ' + next.time : ''}</p></div>`;
}

// PLANES
const PLAN_CATEGORIES = {
    rooftop: { label: "RoofTops", icon: "🌇" },
    spot: { label: "Spots", icon: "📍" },
    restaurant: { label: "Restaurantes", icon: "🍽️" },
    sweet: { label: "Dulces", icon: "🍰" },
    sightseeing: { label: "Turisteo", icon: "🗽" },
    shopping: { label: "Tiendas", icon: "🛍️" },
    other: { label: "Otros", icon: "📌" }
};

let activePlanFilter = "all";

function renderPlans() {
    const container = document.getElementById("plan-list");
    if (!container) return;

    let visiblePlans = activePlanFilter === "all" ? plans : plans.filter(p => (p.category || "other") === activePlanFilter);

    if (!visiblePlans.length) {
        container.innerHTML = `<div class="empty">No hay planes registrados.</div>`;
        return;
    }

    container.innerHTML = visiblePlans.map(plan => {
        const category = PLAN_CATEGORIES[plan.category] || PLAN_CATEGORIES.other;
        const mapsUrl = plan.map_url || (plan.latitude ? `https://www.google.com/maps/search/?api=1&query=${plan.latitude},${plan.longitude}` : (plan.location_name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location_name)}` : null));

        return `
            <article class="activity-card">
                <div class="date-badge">
                    <strong>${plan.date ? new Date(`${plan.date}T00:00:00`).getDate() : '-'}</strong>
                    <span>${plan.date ? new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(`${plan.date}T00:00:00`)) : ''}</span>
                </div>
                <div class="card-main">
                    <span class="type-badge">${category.icon} ${category.label}</span>
                    <strong>${escapeHTML(plan.title)}</strong>
                    ${plan.time ? `<p>🕐 ${escapeHTML(plan.time)}</p>` : ""}
                    ${plan.location_name ? `
                        <p>📍 ${mapsUrl ? `<a href="${escapeHTML(mapsUrl)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHTML(plan.location_name)}</strong> 🗺️</a>` : escapeHTML(plan.location_name)}</p>
                    ` : ""}
                    ${plan.description ? `<p>${escapeHTML(plan.description)}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button type="button" class="danger-button" onclick="deletePlan('${plan.id}')">🗑️</button>
                </div>
            </article>
        `;
    }).join("");
}

function setupPlanFilters() {
    const filterContainer = document.getElementById("plan-filters");
    if (!filterContainer) return;
    filterContainer.querySelectorAll("[data-plan-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            activePlanFilter = btn.dataset.planFilter || "all";
            filterContainer.querySelectorAll("[data-plan-filter]").forEach(b => b.classList.toggle("active", b === btn));
            renderPlans();
        });
    });
}

async function deletePlan(id) {
    if (!confirm("¿Eliminar este plan?")) return;
    await db.from("plans").delete().eq("id", id);
    await loadData();
}

// GUARDAR PLAN (Acepta selección de Google o texto libre)
document.getElementById("plan-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("plan-title").value.trim();
    const description = document.getElementById("plan-description").value.trim();
    const date = document.getElementById("plan-date").value;
    const time = document.getElementById("plan-time").value;
    const category = document.getElementById("plan-category").value;
    const locationInput = document.getElementById("plan-location").value.trim();

    const locationName = selectedPlanLocation ? selectedPlanLocation.name : (locationInput || null);
    const mapsUrl = selectedPlanLocation ? selectedPlanLocation.url : (locationInput ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationInput)}` : null);

    const data = {
        title,
        description,
        date,
        time: time || null,
        category: category || "other",
        location_name: locationName,
        latitude: selectedPlanLocation ? selectedPlanLocation.lat : null,
        longitude: selectedPlanLocation ? selectedPlanLocation.lon : null,
        map_url: mapsUrl,
        created_by: "NY TRIP"
    };

    const { error } = await db.from("plans").insert(data);
    if (error) {
        alert("Error al guardar el plan.");
        return;
    }

    closeModal("plan-modal");
    selectedPlanLocation = null;
    await loadData();
    showScreen("plan");
});

// RESERVAS
function renderReservations() {
    const container = document.getElementById("reservation-list");
    if (!container || !reservations.length) {
        if(container) container.innerHTML = `<div class="empty">📋 Todavía no hay reservas.</div>`;
        return;
    }
    container.innerHTML = reservations.map(r => `
        <article class="reservation-card">
            <div class="card-main">
                <span class="type-badge">📋 Reserva</span>
                <strong>${escapeHTML(r.title)}</strong>
                ${r.date ? `<p>📅 ${formatDate(r.date)}</p>` : ""}
                ${r.location_name ? `<p>📍 ${escapeHTML(r.location_name)}</p>` : ""}
            </div>
            <div class="card-actions">
                <button class="danger-button" onclick="deleteReservation('${r.id}')">🗑️</button>
            </div>
        </article>
    `).join("");
}

async function deleteReservation(id) {
    if (!confirm("¿Eliminar reserva?")) return;
    await db.from("reservations").delete().eq("id", id);
    await loadData();
}

document.getElementById("reservation-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
        title: document.getElementById("reservation-title").value.trim(),
        description: document.getElementById("reservation-description").value.trim(),
        date: document.getElementById("reservation-date").value || null,
        time: document.getElementById("reservation-time").value || null,
        location_name: document.getElementById("reservation-location").value.trim() || null,
        created_by: "NY TRIP"
    };
    await db.from("reservations").insert(data);
    closeModal("reservation-modal");
    await loadData();
    showScreen("reservations");
});

// TRICOUNT
function calculateBalances() {
    const balances = { Laura: 0, Sara: 0, Belén: 0 };
    expenses.forEach(e => {
        const amt = Number(e.amount);
        const payer = e.paid_by;
        const parts = Array.isArray(e.participants) ? e.participants : [];
        if (!parts.length) return;
        const share = amt / parts.length;
        if (balances[payer] !== undefined) balances[payer] += amt;
        parts.forEach(p => { if (balances[p] !== undefined) balances[p] -= share; });
    });
    return balances;
}

function renderExpenses() {
    const container = document.getElementById("expense-list");
    const summary = document.getElementById("expense-summary");
    if (!container || !summary) return;

    const balances = calculateBalances();
    summary.innerHTML = TRAVELERS.map(p => `
        <div class="balance-card">
            <span>${TRAVELER_EMOJIS[p]} ${p}</span>
            <strong class="${balances[p] > 0 ? 'positive' : balances[p] < 0 ? 'negative' : ''}">
                ${formatMoney(balances[p], "EUR")}
            </strong>
        </div>
    `).join("");

    container.innerHTML = expenses.map(e => `
        <article class="expense-card">
            <div class="card-main">
                <strong>${escapeHTML(e.title)}</strong>
                <p>Pagó ${escapeHTML(e.paid_by)}</p>
            </div>
            <div class="card-actions">
                <strong>${formatMoney(e.amount, e.currency)}</strong>
                <button class="danger-button" onclick="deleteExpense('${e.id}')">🗑️</button>
            </div>
        </article>
    `).join("");
}

async function deleteExpense(id) {
    if (!confirm("¿Eliminar gasto?")) return;
    await db.from("expenses").delete().eq("id", id);
    await loadData();
}

document.getElementById("expense-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const participants = Array.from(document.querySelectorAll('input[name="participant"]:checked')).map(i => i.value);
    const data = {
        title: document.getElementById("expense-title").value.trim(),
        amount: Number(document.getElementById("expense-amount").value),
        currency: document.getElementById("expense-currency").value,
        paid_by: document.getElementById("expense-paid-by").value,
        participants,
        date: document.getElementById("expense-date").value || null,
        created_by: "NY TRIP"
    };
    await db.from("expenses").insert(data);
    closeModal("expense-modal");
    await loadData();
    showScreen("expenses");
});

// MAPA LEAFLET
function initializeMap() {
    if (map) return;
    const mapEl = document.getElementById("map");
    if (!mapEl) return;
    map = L.map(mapEl).setView([40.7128, -74.0060], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
}

function renderMap() {
    if (!map) return;
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    const addM = (lat, lon, title, desc, url) => {
        if (!lat || !lon) return;
        const m = L.marker([Number(lat), Number(lon)]).addTo(map);
        m.bindPopup(`<strong>${escapeHTML(title)}</strong><br>${escapeHTML(desc || '')}${url ? `<br><a href="${url}" target="_blank">Abrir Google Maps</a>` : ''}`);
        mapMarkers.push(m);
    };

    addM(HOTEL.latitude, HOTEL.longitude, "🏨 Hotel", HOTEL.name);
    plans.forEach(p => addM(p.latitude, p.longitude, `📅 ${p.title}`, p.location_name, p.map_url));
}

function renderFlights() {
    const container = document.getElementById("flight-list");
    if (!container) return;
    container.innerHTML = flights.map(f => `
        <article class="flight-card">
            <div class="card-main">
                <strong>${f.airline} (${f.flightNumber})</strong>
                <p>${f.from} ➔ ${f.to} | ${f.date}</p>
                <p>Salida: ${f.departure} - Llegada: ${f.arrival}</p>
            </div>
        </article>
    `).join("");
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    setupAuthentication();
    setupPlanFilters();
    checkAuthentication();
});
