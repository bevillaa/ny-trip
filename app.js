// ==========================================
// 🗽 NY TRIP
// APLICACIÓN COMPLETA
// AUTENTICACIÓN SUPABASE
// ==========================================

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
"https://rtbrnbyosrtxeayqmvwc.supabase.co";

const SUPABASE_KEY =
"sb_publishable_xvstsFi5T_bbgYb-9qiJ6A_y8OrALEA";

const db =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

// ==========================================
// DATOS FIJOS DEL VIAJE
// ==========================================

const TRAVELERS = [
"Laura",
"Sara",
"Belén"
];

const TRAVELER_EMOJIS = {
Laura: "😈",
Sara: "😇",
Belén: "🤪"
};

const TRIP_START =
new Date("2026-12-26T00:00:00");

const TRIP_END =
new Date("2027-01-04T23:59:59");

const flights = [
{
flightNumber: "EI583",
airline: "Aer Lingus",
from: "AGP",
to: "DUB",
date: "2026-12-26",
departure: "12:30",
arrival: "14:45",
duration: "3h 15m"
},

```
{
    flightNumber: "EI107",
    airline: "Aer Lingus",
    from: "DUB",
    to: "JFK",
    date: "2026-12-26",
    departure: "16:45",
    arrival: "19:25",
    duration: "7h 40m"
},

{
    flightNumber: "EI104",
    airline: "Aer Lingus",
    from: "JFK",
    to: "DUB",
    date: "2027-01-04",
    departure: "17:00",
    arrival: "04:20",
    duration: "6h 20m"
},

{
    flightNumber: "EI582",
    airline: "Aer Lingus",
    from: "DUB",
    to: "AGP",
    date: "2027-01-05",
    departure: "07:10",
    arrival: "11:20",
    duration: "3h 10m"
}
```

];

const HOTEL = {
name:
"Courtyard by Marriott New York Manhattan Upper East Side",

```
address:
    "Nueva York, Estados Unidos",

latitude:
    40.7744,

longitude:
    -73.9500,

bookingUrl:
    "https://www.booking.com/hotel/us/manhattan-upper-east-side-courtyard-by-marriott.es.html"
```

};

// ==========================================
// ESTADO
// ==========================================

let plans = [];
let reservations = [];
let expenses = [];
let places = [];

let map = null;
let mapMarkers = [];

let currentUser = null;

let realtimeChannel = null;

// ==========================================
// UTILIDADES
// ==========================================

function escapeHTML(value) {

```
if (
    value === null ||
    value === undefined
) {
    return "";
}

return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
```

}

function formatMoney(
amount,
currency
) {

```
return new Intl.NumberFormat(
    "es-ES",
    {
        style: "currency",
        currency: currency || "EUR"
    }
).format(
    Number(amount) || 0
);
```

}

function formatDate(date) {

```
if (!date) {
    return "";
}

return new Intl.DateTimeFormat(
    "es-ES",
    {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
).format(
    new Date(
        `${date}T00:00:00`
    )
);
```

}

function getDateTimestamp(
date,
time
) {

```
if (!date) {
    return Number.MAX_SAFE_INTEGER;
}

return new Date(
    `${date}T${time || "00:00"}:00`
).getTime();
```

}

// ==========================================
// AUTENTICACIÓN
// ==========================================

function showLogin() {

```
const loginScreen =
    document.getElementById(
        "login-screen"
    );

const app =
    document.getElementById(
        "app"
    );

if (loginScreen) {
    loginScreen.hidden = false;
}

if (app) {
    app.hidden = true;
}
```

}

function showApp() {

```
const loginScreen =
    document.getElementById(
        "login-screen"
    );

const app =
    document.getElementById(
        "app"
    );

if (loginScreen) {
    loginScreen.hidden = true;
}

if (app) {
    app.hidden = false;
}
```

}

function showLoginError(
message
) {

```
const element =
    document.getElementById(
        "login-error"
    );

if (!element) {
    return;
}

element.textContent =
    message || "";

element.hidden =
    !message;
```

}

function setLoginLoading(
loading
) {

```
const button =
    document.getElementById(
        "login-button"
    );

if (!button) {
    return;
}

button.disabled =
    loading;

button.textContent =
    loading
        ? "Entrando..."
        : "Entrar";
```

}

function updateCurrentUser() {

```
const element =
    document.getElementById(
        "current-user-email"
    );

if (!element) {
    return;
}

if (currentUser?.email) {

    element.textContent =
        currentUser.email;

} else {

    element.textContent =
        "Usuario";

}
```

}

async function loginUser(
email,
password
) {

```
showLoginError("");

setLoginLoading(true);

try {

    const {
        data,
        error
    } =
        await db.auth.signInWithPassword({
            email:
                email.trim(),
            password
        });

    if (error) {
        throw error;
    }

    currentUser =
        data.user || null;

    if (!currentUser) {

        throw new Error(
            "Supabase no devolvió el usuario."
        );

    }

    updateCurrentUser();

    showApp();

    await startNYTrip();

} catch (error) {

    console.error(
        "Login:",
        error
    );

    let message =
        "No se pudo iniciar sesión.";

    if (
        error?.message
            ?.toLowerCase()
            .includes(
                "invalid login credentials"
            )
    ) {

        message =
            "Email o contraseña incorrectos.";

    } else if (
        error?.message
    ) {

        message =
            error.message;

    }

    showLoginError(
        message
    );

} finally {

    setLoginLoading(false);

}
```

}

async function logoutUser() {

```
try {

    const {
        error
    } =
        await db.auth.signOut();

    if (error) {
        throw error;
    }

    currentUser = null;

    plans = [];
    reservations = [];
    expenses = [];
    places = [];

    if (realtimeChannel) {

        try {

            await db.removeChannel(
                realtimeChannel
            );

        } catch (error) {

            console.warn(
                "No se pudo cerrar Realtime:",
                error
            );

        }

        realtimeChannel = null;

    }

    showLogin();

    const emailInput =
        document.getElementById(
            "login-email"
        );

    const passwordInput =
        document.getElementById(
            "login-password"
        );

    if (passwordInput) {
        passwordInput.value = "";
    }

    if (emailInput) {
        emailInput.focus();
    }

    showLoginError("");

} catch (error) {

    console.error(
        "Logout:",
        error
    );

    alert(
        "No se pudo cerrar la sesión."
    );

}
```

}

function initializeAuthentication() {

```
const loginForm =
    document.getElementById(
        "login-form"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById(
                        "login-email"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "login-password"
                    )
                    .value;

            await loginUser(
                email,
                password
            );

        }
    );

}


const logoutButton =
    document.getElementById(
        "logout-button"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutUser
    );

}


db.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        console.log(
            "Supabase Auth:",
            event
        );

        if (
            session?.user
        ) {

            currentUser =
                session.user;

            updateCurrentUser();

            showApp();

        } else {

            currentUser =
                null;

            showLogin();

        }

    }
);
```

}

// ==========================================
// CONEXIÓN
// ==========================================

function setConnectionStatus(
text,
state = ""
) {

```
const element =
    document.getElementById(
        "connection-status"
    );

if (!element) {
    return;
}

element.textContent =
    text;

element.className =
    "connection-status " +
    state;
```

}

// ==========================================
// NAVEGACIÓN
// ==========================================

function showScreen(name) {

```
document
    .querySelectorAll(".screen")
    .forEach(
        (screen) => {

            screen.classList.remove(
                "active"
            );

        }
    );

const target =
    document.getElementById(
        `screen-${name}`
    );

if (target) {

    target.classList.add(
        "active"
    );

}

document
    .querySelectorAll(".nav-button")
    .forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.screen ===
                    name
            );

        }
    );

if (
    name === "map"
) {

    setTimeout(
        () => {

            initializeMap();

            if (map) {

                map.invalidateSize();

                renderMap();

            }

        },
        100
    );

}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
```

}

document.addEventListener(
"click",
(event) => {

```
    const button =
        event.target.closest(
            "[data-screen]"
        );

    if (!button) {
        return;
    }

    showScreen(
        button.dataset.screen
    );

}
```

);

// ==========================================
// MODALES
// ==========================================

function openModal(id) {

```
const modal =
    document.getElementById(id);

if (modal) {
    modal.classList.remove(
        "hidden"
    );
}
```

}

function closeModal(id) {

```
const modal =
    document.getElementById(id);

if (modal) {
    modal.classList.add(
        "hidden"
    );
}
```

}

document.addEventListener(
"click",
(event) => {

```
    const button =
        event.target.closest(
            "[data-close]"
        );

    if (!button) {
        return;
    }

    closeModal(
        button.dataset.close
    );

}
```

);

const openPlanForm =
document.getElementById(
"open-plan-form"
);

if (openPlanForm) {

```
openPlanForm.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "plan-form"
            )
            .reset();

        document
            .getElementById(
                "plan-location-results"
            )
            .innerHTML = "";

        selectedPlanLocation =
            null;

        openModal(
            "plan-modal"
        );

    }
);
```

}

const openReservationForm =
document.getElementById(
"open-reservation-form"
);

if (openReservationForm) {

```
openReservationForm.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "reservation-form"
            )
            .reset();

        document
            .getElementById(
                "reservation-location-results"
            )
            .innerHTML = "";

        selectedReservationLocation =
            null;

        openModal(
            "reservation-modal"
        );

    }
);
```

}

const openExpenseForm =
document.getElementById(
"open-expense-form"
);

if (openExpenseForm) {

```
openExpenseForm.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "expense-form"
            )
            .reset();

        document
            .querySelectorAll(
                'input[name="participant"]'
            )
            .forEach(
                (input) => {

                    input.checked =
                        true;

                }
            );

        openModal(
            "expense-modal"
        );

    }
);
```

}

// ==========================================
// CUENTA ATRÁS
// ==========================================

function updateTripDay() {

```
const element =
    document.getElementById(
        "trip-day"
    );

if (!element) {
    return;
}

const today =
    new Date();

today.setHours(
    0,
    0,
    0,
    0
);

if (
    today < TRIP_START
) {

    const difference =
        TRIP_START.getTime() -
        today.getTime();

    const days =
        Math.ceil(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        );

    element.textContent =
        `FALTAN ${days} DÍAS`;

    return;

}

if (
    today <= TRIP_END
) {

    const difference =
        today.getTime() -
        TRIP_START.getTime();

    const day =
        Math.floor(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        ) + 1;

    const date =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                day: "numeric",
                month: "long"
            }
        ).format(
            today
        );

    element.textContent =
        `DÍA ${day} · ${date}`;

    return;

}

element.textContent =
    "VIAJE FINALIZADO";
```

}

// ==========================================
// TIEMPO — OPEN-METEO
// ==========================================

async function loadWeather() {

```
try {

    const url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=40.7128" +
        "&longitude=-74.0060" +
        "&current=temperature_2m,weather_code,wind_speed_10m" +
        "&timezone=America%2FNew_York";

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            "Error de meteorología"
        );

    }

    const data =
        await response.json();

    const current =
        data.current;

    document
        .getElementById(
            "weather-temperature"
        )
        .textContent =
        `${Math.round(
            current.temperature_2m
        )}°C`;

    document
        .getElementById(
            "weather-wind"
        )
        .textContent =
        `Viento ${Math.round(
            current.wind_speed_10m
        )} km/h`;

    document
        .getElementById(
            "weather-description"
        )
        .textContent =
        weatherDescription(
            current.weather_code
        );

    document
        .getElementById(
            "weather-icon"
        )
        .textContent =
        weatherIcon(
            current.weather_code
        );

    document
        .getElementById(
            "weather-update"
        )
        .textContent =
        "Actualizado ahora";

} catch (error) {

    console.error(
        "Tiempo:",
        error
    );

    const element =
        document.getElementById(
            "weather-description"
        );

    if (element) {

        element.textContent =
            "No disponible";

    }

}
```

}

function weatherDescription(code) {

```
if (code === 0) {
    return "Despejado";
}

if (
    [1, 2, 3].includes(code)
) {
    return "Parcialmente nublado";
}

if (
    [45, 48].includes(code)
) {
    return "Niebla";
}

if (
    [51, 53, 55, 56, 57].includes(code)
) {
    return "Llovizna";
}

if (
    [61, 63, 65, 66, 67].includes(code)
) {
    return "Lluvia";
}

if (
    [71, 73, 75, 77].includes(code)
) {
    return "Nieve";
}

if (
    [80, 81, 82].includes(code)
) {
    return "Chubascos";
}

if (
    [95, 96, 99].includes(code)
) {
    return "Tormenta";
}

return "Tiempo variable";
```

}

function weatherIcon(code) {

```
if (code === 0) {
    return "☀️";
}

if (
    [1, 2, 3].includes(code)
) {
    return "🌤️";
}

if (
    [45, 48].includes(code)
) {
    return "🌫️";
}

if (
    [51, 53, 55, 56, 57].includes(code)
) {
    return "🌦️";
}

if (
    [61, 63, 65, 66, 67].includes(code)
) {
    return "🌧️";
}

if (
    [71, 73, 75, 77].includes(code)
) {
    return "❄️";
}

if (
    [80, 81, 82].includes(code)
) {
    return "🌦️";
}

if (
    [95, 96, 99].includes(code)
) {
    return "⛈️";
}

return "🌤️";
```

}

// ==========================================
// DIVISAS
// ==========================================

async function loadCurrency() {

```
const rateElement =
    document.getElementById(
        "currency-value"
    );

const labelElement =
    document.getElementById(
        "currency-rate"
    );

if (!rateElement) {
    return;
}

try {

    rateElement.textContent =
        "Actualizando...";

    if (labelElement) {

        labelElement.textContent =
            "1 EUR → USD";

    }

    let rate = null;

    try {

        const response =
            await fetch(
                "https://api.frankfurter.app/latest?from=EUR&to=USD",
                {
                    cache: "no-store"
                }
            );

        if (response.ok) {

            const data =
                await response.json();

            const value =
                Number(
                    data?.rates?.USD
                );

            if (
                Number.isFinite(value) &&
                value > 0
            ) {

                rate = value;

            }

        }

    } catch (error) {

        console.warn(
            "Frankfurter no disponible:",
            error
        );

    }


    if (
        rate === null
    ) {

        try {

            const response =
                await fetch(
                    "https://open.er-api.com/v6/latest/EUR",
                    {
                        cache: "no-store"
                    }
                );

            if (response.ok) {

                const data =
                    await response.json();

                const value =
                    Number(
                        data?.rates?.USD
                    );

                if (
                    Number.isFinite(value) &&
                    value > 0
                ) {

                    rate = value;

                }

            }

        } catch (error) {

            console.warn(
                "ExchangeRate API no disponible:",
                error
            );

        }

    }


    if (
        rate !== null
    ) {

        rateElement.textContent =
            `${rate.toFixed(4)} $`;

        if (labelElement) {

            labelElement.textContent =
                "1 EUR → USD";

        }

        const updateElement =
            document.getElementById(
                "currency-update"
            );

        if (updateElement) {

            updateElement.textContent =
                "Actualizado ahora";

        }

        return;

    }

    throw new Error(
        "Ninguna API de divisas respondió correctamente."
    );

} catch (error) {

    console.error(
        "Divisas:",
        error
    );

    rateElement.textContent =
        "No disponible";

    if (labelElement) {

        labelElement.textContent =
            "EUR → USD";

    }

}
```

}

// ==========================================
// SUPABASE — CARGAR TODO
// ==========================================

async function loadData() {

```
if (!currentUser) {

    console.warn(
        "loadData cancelado: no hay usuario autenticado."
    );

    return;

}

setConnectionStatus(
    "● Sincronizando..."
);

try {

    const [
        plansResponse,
        reservationsResponse,
        expensesResponse,
        placesResponse
    ] = await Promise.all([

        db
            .from("plans")
            .select("*")
            .order(
                "date",
                {
                    ascending: true
                }
            )
            .order(
                "time",
                {
                    ascending: true
                }
            ),

        db
            .from("reservations")
            .select("*")
            .order(
                "date",
                {
                    ascending: true
                }
            ),

        db
            .from("expenses")
            .select("*")
            .order(
                "date",
                {
                    ascending: false
                }
            ),

        db
            .from("places")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )

    ]);


    if (
        plansResponse.error
    ) {
        throw plansResponse.error;
    }

    if (
        reservationsResponse.error
    ) {
        throw reservationsResponse.error;
    }

    if (
        expensesResponse.error
    ) {
        throw expensesResponse.error;
    }

    if (
        placesResponse.error
    ) {
        throw placesResponse.error;
    }


    plans =
        plansResponse.data || [];

    reservations =
        reservationsResponse.data || [];

    expenses =
        expensesResponse.data || [];

    places =
        placesResponse.data || [];


    setConnectionStatus(
        "● Conectada",
        "ok"
    );

    renderAll();

} catch (error) {

    console.error(
        "Supabase:",
        error
    );

    setConnectionStatus(
        "● Error de conexión",
        "error"
    );

    renderAll();

}
```

}

// ==========================================
// RENDER GENERAL
// ==========================================

function renderAll() {

```
renderNextActivity();

renderPlans();

renderReservations();

renderExpenses();

renderFlights();

renderMap();
```

}

// ==========================================
// PRÓXIMA ACTIVIDAD
// ==========================================

function renderNextActivity() {

```
const element =
    document.getElementById(
        "next-activity"
    );

if (!element) {
    return;
}

const allItems = [

    ...plans.map(
        item => ({
            ...item,
            itemType: "plan"
        })
    ),

    ...reservations.map(
        item => ({
            ...item,
            itemType: "reservation"
        })
    )

]
.filter(
    item => item.date
)
.sort(
    (a, b) =>
        getDateTimestamp(
            a.date,
            a.time
        ) -
        getDateTimestamp(
            b.date,
            b.time
        )
);


if (
    !allItems.length
) {

    element.innerHTML = `
        <span>📅</span>

        <div>
            <strong>
                Aún no hay actividades
            </strong>

            <p>
                Añade vuestro primer plan.
            </p>
        </div>
    `;

    return;

}


const item =
    allItems[0];

const icon =
    item.itemType === "plan"
        ? "📅"
        : "📋";


element.innerHTML = `

    <span>
        ${icon}
    </span>

    <div>

        <strong>
            ${escapeHTML(
                item.title
            )}
        </strong>

        <p>
            ${formatDate(item.date)}
            ${
                item.time
                    ? " · " + item.time
                    : ""
            }
            ${
                item.location_name
                    ? " · " +
                      escapeHTML(
                          item.location_name
                      )
                    : ""
            }
        </p>

    </div>

`;
```

}

// ==========================================
// PLANES
// ==========================================

function renderPlans() {

```
const container =
    document.getElementById(
        "plan-list"
    );

if (!container) {
    return;
}


if (!plans.length) {

    container.innerHTML = `
        <div class="empty">
            📅 Todavía no hay planes.
            <br><br>
            Pulsa <strong>+ Añadir</strong>.
        </div>
    `;

    return;

}


container.innerHTML =
    plans
        .map(
            plan => `

            <article class="activity-card">

                <div class="date-badge">

                    <strong>
                        ${new Date(
                            `${plan.date}T00:00:00`
                        ).getDate()}
                    </strong>

                    <span>
                        ${new Intl.DateTimeFormat(
                            "es-ES",
                            {
                                month: "short"
                            }
                        ).format(
                            new Date(
                                `${plan.date}T00:00:00`
                            )
                        )}
                    </span>

                </div>

                <div class="card-main">

                    <strong>
                        ${escapeHTML(
                            plan.title
                        )}
                    </strong>

                    <p>
                        ${
                            plan.time
                                ? "🕐 " +
                                  plan.time
                                : ""
                        }
                    </p>

                    ${
                        plan.location_name
                            ? `
                            <p>
                                📍 ${
                                    escapeHTML(
                                        plan.location_name
                                    )
                                }
                            </p>
                            `
                            : ""
                    }

                    ${
                        plan.description
                            ? `
                            <p>
                                ${
                                    escapeHTML(
                                        plan.description
                                    )
                                }
                            </p>
                            `
                            : ""
                    }

                </div>

                <div class="card-actions">

                    <button
                        class="danger-button"
                        onclick="deletePlan('${plan.id}')"
                    >
                        🗑️
                    </button>

                </div>

            </article>

        `
        )
        .join("");
```

}

async function deletePlan(id) {

```
if (
    !currentUser
) {
    return;
}

if (
    !confirm(
        "¿Eliminar este plan?"
    )
) {
    return;
}


const {
    error
} =
    await db
        .from("plans")
        .delete()
        .eq(
            "id",
            id
        );


if (error) {

    alert(
        "No se pudo eliminar."
    );

    console.error(
        error
    );

    return;

}


await loadData();
```

}

// ==========================================
// CREAR PLAN
// ==========================================

let selectedPlanLocation = null;

const searchPlanLocation =
document.getElementById(
"search-plan-location"
);

if (searchPlanLocation) {

```
searchPlanLocation.addEventListener(
    "click",
    () => {

        const query =
            document
                .getElementById(
                    "plan-location"
                )
                .value
                .trim();

        searchLocation(
            query,
            "plan-location-results",
            (result) => {

                selectedPlanLocation =
                    result;

            }
        );

    }
);
```

}

const planForm =
document.getElementById(
"plan-form"
);

if (planForm) {

```
planForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) {

            alert(
                "Debes iniciar sesión."
            );

            return;

        }


        const title =
            document
                .getElementById(
                    "plan-title"
                )
                .value
                .trim();

        const description =
            document
                .getElementById(
                    "plan-description"
                )
                .value
                .trim();

        const date =
            document
                .getElementById(
                    "plan-date"
                )
                .value;

        const time =
            document
                .getElementById(
                    "plan-time"
                )
                .value;

        const locationName =
            document
                .getElementById(
                    "plan-location"
                )
                .value
                .trim();


        const data = {

            title,

            description,

            date,

            time:
                time || null,

            location_name:
                locationName || null,

            latitude:
                selectedPlanLocation
                    ?.lat || null,

            longitude:
                selectedPlanLocation
                    ?.lon || null,

            created_by:
                currentUser.id

        };


        const {
            error
        } =
            await db
                .from("plans")
                .insert(
                    data
                );


        if (error) {

            alert(
                "No se pudo guardar el plan."
            );

            console.error(
                error
            );

            return;

        }


        closeModal(
            "plan-modal"
        );

        selectedPlanLocation =
            null;

        await loadData();

        showScreen(
            "plan"
        );

    }
);
```

}

// ==========================================
// RESERVAS
// ==========================================

function reservationIcon(type) {

```
const icons = {

    restaurant: "🍽️",

    activity: "🎟️",

    hotel: "🏨",

    flight: "✈️",

    other: "📋"

};

return (
    icons[type] ||
    "📋"
);
```

}

function reservationTypeName(type) {

```
const names = {

    restaurant: "Restaurante",

    activity: "Actividad",

    hotel: "Hotel",

    flight: "Vuelo",

    other: "Otro"

};

return (
    names[type] ||
    "Reserva"
);
```

}

function renderReservations() {

```
const container =
    document.getElementById(
        "reservation-list"
    );

if (!container) {
    return;
}


if (
    !reservations.length
) {

    container.innerHTML = `
        <div class="empty">
            📋 Todavía no hay reservas.
            <br><br>
            Pulsa <strong>+ Añadir</strong>.
        </div>
    `;

    return;

}


container.innerHTML =
    reservations
        .map(
            reservation => `

            <article class="reservation-card">

                <div class="card-main">

                    <span class="type-badge">
                        ${
                            reservationIcon(
                                reservation.type
                            )
                        }
                        ${
                            reservationTypeName(
                                reservation.type
                            )
                        }
                    </span>

                    <strong>
                        ${escapeHTML(
                            reservation.title
                        )}
                    </strong>

                    <p>
                        ${
                            reservation.date
                                ? "📅 " +
                                  formatDate(
                                      reservation.date
                                  )
                                : ""
                        }

                        ${
                            reservation.time
                                ? " · 🕐 " +
                                  reservation.time
                                : ""
                        }
                    </p>

                    ${
                        reservation.location_name
                            ? `
                            <p>
                                📍 ${
                                    escapeHTML(
                                        reservation.location_name
                                    )
                                }
                            </p>
                            `
                            : ""
                    }

                    ${
                        reservation.description
                            ? `
                            <p>
                                ${
                                    escapeHTML(
                                        reservation.description
                                    )
                                }
                            </p>
                            `
                            : ""
                    }

                    ${
                        reservation.booking_url
                            ? `
                            <p>
                                <a
                                    href="${
                                        escapeHTML(
                                            reservation.booking_url
                                        )
                                    }"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    🔗 Abrir reserva
                                </a>
                            </p>
                            `
                            : ""
                    }

                </div>

                <div class="card-actions">

                    <button
                        class="danger-button"
                        onclick="deleteReservation('${reservation.id}')"
                    >
                        🗑️
                    </button>

                </div>

            </article>

        `
        )
        .join("");
```

}

async function deleteReservation(
id
) {

```
if (!currentUser) {
    return;
}

if (
    !confirm(
        "¿Eliminar esta reserva?"
    )
) {
    return;
}


const {
    error
} =
    await db
        .from("reservations")
        .delete()
        .eq(
            "id",
            id
        );


if (error) {

    alert(
        "No se pudo eliminar."
    );

    console.error(
        error
    );

    return;

}


await loadData();
```

}

let selectedReservationLocation =
null;

const searchReservationLocation =
document.getElementById(
"search-reservation-location"
);

if (searchReservationLocation) {

```
searchReservationLocation.addEventListener(
    "click",
    () => {

        const query =
            document
                .getElementById(
                    "reservation-location"
                )
                .value
                .trim();

        searchLocation(
            query,
            "reservation-location-results",
            (result) => {

                selectedReservationLocation =
                    result;

            }
        );

    }
);
```

}

const reservationForm =
document.getElementById(
"reservation-form"
);

if (reservationForm) {

```
reservationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) {

            alert(
                "Debes iniciar sesión."
            );

            return;

        }


        const data = {

            type:
                document
                    .getElementById(
                        "reservation-type"
                    )
                    .value,

            title:
                document
                    .getElementById(
                        "reservation-title"
                    )
                    .value
                    .trim(),

            description:
                document
                    .getElementById(
                        "reservation-description"
                    )
                    .value
                    .trim(),

            date:
                document
                    .getElementById(
                        "reservation-date"
                    )
                    .value ||
                null,

            time:
                document
                    .getElementById(
                        "reservation-time"
                    )
                    .value ||
                null,

            location_name:
                document
                    .getElementById(
                        "reservation-location"
                    )
                    .value
                    .trim() ||
                null,

            latitude:
                selectedReservationLocation
                    ?.lat ||
                null,

            longitude:
                selectedReservationLocation
                    ?.lon ||
                null,

            booking_url:
                document
                    .getElementById(
                        "reservation-url"
                    )
                    .value
                    .trim() ||
                null,

            created_by:
                currentUser.id

        };


        const {
            error
        } =
            await db
                .from("reservations")
                .insert(
                    data
                );


        if (error) {

            alert(
                "No se pudo guardar la reserva."
            );

            console.error(
                error
            );

            return;

        }


        closeModal(
            "reservation-modal"
        );

        selectedReservationLocation =
            null;

        await loadData();

        showScreen(
            "reservations"
        );

    }
);
```

}

// ==========================================
// TRICOUNT
// ==========================================

function calculateBalances() {

```
const balances = {

    Laura: 0,

    Sara: 0,

    Belén: 0

};


expenses.forEach(
    expense => {

        const amount =
            Number(
                expense.amount
            );

        const payer =
            expense.paid_by;

        const participants =
            Array.isArray(
                expense.participants
            )
                ? expense.participants
                : [];


        if (
            !participants.length
        ) {
            return;
        }


        const share =
            amount /
            participants.length;


        if (
            balances[payer] !==
            undefined
        ) {

            balances[payer] +=
                amount;

        }


        participants.forEach(
            person => {

                if (
                    balances[person] !==
                    undefined
                ) {

                    balances[person] -=
                        share;

                }

            }
        );

    }
);


return balances;
```

}

function calculateDebts() {

```
const balances =
    calculateBalances();

const creditors = [];

const debtors = [];


Object.entries(
    balances
).forEach(
    ([name, balance]) => {

        if (
            balance > 0.01
        ) {

            creditors.push({
                name,
                amount: balance
            });

        }


        if (
            balance < -0.01
        ) {

            debtors.push({
                name,
                amount: -balance
            });

        }

    }
);


const debts = [];

let i = 0;

let j = 0;


while (
    i < debtors.length &&
    j < creditors.length
) {

    const debtor =
        debtors[i];

    const creditor =
        creditors[j];


    const amount =
        Math.min(
            debtor.amount,
            creditor.amount
        );


    debts.push({

        from:
            debtor.name,

        to:
            creditor.name,

        amount

    });


    debtor.amount -=
        amount;

    creditor.amount -=
        amount;


    if (
        debtor.amount < 0.01
    ) {

        i++;

    }


    if (
        creditor.amount < 0.01
    ) {

        j++;

    }

}


return debts;
```

}

function renderExpenses() {

```
const balances =
    calculateBalances();


const total =
    expenses.reduce(
        (
            sum,
            expense
        ) =>
            sum +
            Number(
                expense.amount
            ),
        0
    );


const summary =
    document.getElementById(
        "expense-summary"
    );

if (!summary) {
    return;
}


summary.innerHTML =
    TRAVELERS
        .map(
            person => {

                const balance =
                    balances[
                        person
                    ];

                return `

                    <div class="balance-card">

                        <span>
                            ${
                                TRAVELER_EMOJIS[
                                    person
                                ]
                            }
                            ${person}
                        </span>

                        <strong
                            class="${
                                balance > 0.01
                                    ? "positive"
                                    : balance < -0.01
                                        ? "negative"
                                        : ""
                            }"
                        >
                            ${
                                balance >= 0
                                    ? "+"
                                    : ""
                            }
                            ${
                                formatMoney(
                                    balance,
                                    "EUR"
                                )
                            }
                        </strong>

                    </div>

                `;

            }
        )
        .join("");


const totalCard =
    document.createElement(
        "div"
    );

totalCard.className =
    "balance-card";


totalCard.innerHTML = `

    <span>
        Total
    </span>

    <strong>
        ${
            formatMoney(
                total,
                "EUR"
            )
        }
    </strong>

`;


summary.appendChild(
    totalCard
);


renderDebts();


const container =
    document.getElementById(
        "expense-list"
    );

if (!container) {
    return;
}


if (
    !expenses.length
) {

    container.innerHTML = `
        <div class="empty">
            💰 Todavía no hay gastos.
        </div>
    `;

    return;

}


container.innerHTML =
    expenses
        .map(
            expense => {

                const participants =
                    Array.isArray(
                        expense.participants
                    )
                        ? expense.participants
                        : [];


                return `

                    <article class="expense-card">

                        <div class="card-main">

                            <strong>
                                ${escapeHTML(
                                    expense.title
                                )}
                            </strong>

                            <p>
                                ${
                                    TRAVELER_EMOJIS[
                                        expense.paid_by
                                    ] || ""
                                }
                                Pagó
                                ${
                                    escapeHTML(
                                        expense.paid_by
                                    )
                                }
                            </p>

                            <p>
                                👥
                                ${
                                    participants
                                        .map(
                                            person =>
                                                escapeHTML(
                                                    person
                                                )
                                        )
                                        .join(
                                            ", "
                                        )
                                }
                            </p>

                            ${
                                expense.date
                                    ? `
                                    <p>
                                        📅 ${
                                            formatDate(
                                                expense.date
                                            )
                                        }
                                    </p>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="card-actions">

                            <strong>
                                ${
                                    formatMoney(
                                        expense.amount,
                                        expense.currency
                                    )
                                }
                            </strong>

                            <button
                                class="danger-button"
                                onclick="deleteExpense('${expense.id}')"
                            >
                                🗑️
                            </button>

                        </div>

                    </article>

                `;

            }
        )
        .join("");
```

}

function renderDebts() {

```
const container =
    document.getElementById(
        "debts"
    );

if (!container) {
    return;
}


const debts =
    calculateDebts();


if (!debts.length) {

    container.innerHTML = `
        <div class="debt-card">

            <strong>
                🎉 Estáis a cero
            </strong>

            <span>
                Nadie debe nada.
            </span>

        </div>
    `;

    return;

}


container.innerHTML =
    debts
        .map(
            debt => `

                <div class="debt-card">

                    <strong>
                        ${
                            TRAVELER_EMOJIS[
                                debt.from
                            ]
                        }
                        ${escapeHTML(
                            debt.from
                        )}

                        →

                        ${
                            TRAVELER_EMOJIS[
                                debt.to
                            ]
                        }
                        ${escapeHTML(
                            debt.to
                        )}
                    </strong>

                    <span class="debt-amount">
                        ${
                            formatMoney(
                                debt.amount,
                                "EUR"
                            )
                        }
                    </span>

                </div>

            `
        )
        .join("");
```

}

async function deleteExpense(id) {

```
if (!currentUser) {
    return;
}


if (
    !confirm(
        "¿Eliminar este gasto?"
    )
) {
    return;
}


const {
    error
} =
    await db
        .from("expenses")
        .delete()
        .eq(
            "id",
            id
        );


if (error) {

    alert(
        "No se pudo eliminar."
    );

    console.error(
        error
    );

    return;

}


await loadData();
```

}

const expenseForm =
document.getElementById(
"expense-form"
);

if (expenseForm) {

```
expenseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) {

            alert(
                "Debes iniciar sesión."
            );

            return;

        }


        const participants =
            Array.from(
                document.querySelectorAll(
                    'input[name="participant"]:checked'
                )
            )
            .map(
                input =>
                    input.value
            );


        if (
            participants.length === 0
        ) {

            alert(
                "Selecciona al menos una participante."
            );

            return;

        }


        const data = {

            title:
                document
                    .getElementById(
                        "expense-title"
                    )
                    .value
                    .trim(),

            amount:
                Number(
                    document
                        .getElementById(
                            "expense-amount"
                        )
                        .value
                ),

            currency:
                document
                    .getElementById(
                        "expense-currency"
                    )
                    .value,

            paid_by:
                document
                    .getElementById(
                        "expense-paid-by"
                    )
                    .value,

            participants,

            date:
                document
                    .getElementById(
                        "expense-date"
                    )
                    .value ||
                null,

            notes:
                document
                    .getElementById(
                        "expense-notes"
                    )
                    .value
                    .trim() ||
                null,

            created_by:
                currentUser.id

        };


        const {
            error
        } =
            await db
                .from("expenses")
                .insert(
                    data
                );


        if (error) {

            alert(
                "No se pudo guardar el gasto."
            );

            console.error(
                error
            );

            return;

        }


        closeModal(
            "expense-modal"
        );

        await loadData();

        showScreen(
            "expenses"
        );

    }
);
```

}

// ==========================================
// MAPA
// ==========================================

function initializeMap() {

```
if (map) {
    return;
}


const mapElement =
    document.getElementById(
        "map"
    );

if (!mapElement) {
    return;
}


map =
    L.map(
        mapElement
    ).setView(
        [
            40.7128,
            -74.0060
        ],
        12
    );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(
    map
);
```

}

function clearMapMarkers() {

```
if (!map) {
    return;
}


mapMarkers.forEach(
    marker => {

        map.removeLayer(
            marker
        );

    }
);


mapMarkers = [];
```

}

function addMarker(
latitude,
longitude,
title,
description
) {

```
if (!map) {
    return;
}


if (
    latitude === null ||
    longitude === null ||
    latitude === undefined ||
    longitude === undefined
) {
    return;
}


const marker =
    L.marker(
        [
            Number(latitude),
            Number(longitude)
        ]
    )
    .addTo(
        map
    );


marker.bindPopup(`

    <strong>
        ${escapeHTML(title)}
    </strong>

    <br>

    ${
        description
            ? escapeHTML(
                description
            )
            : ""
    }

`);


mapMarkers.push(
    marker
);
```

}

function renderMap() {

```
if (!map) {
    return;
}


clearMapMarkers();


addMarker(
    HOTEL.latitude,
    HOTEL.longitude,
    "🏨 Hotel",
    HOTEL.name
);


plans.forEach(
    plan => {

        addMarker(
            plan.latitude,
            plan.longitude,
            `📅 ${plan.title}`,
            plan.location_name
        );

    }
);


reservations.forEach(
    reservation => {

        addMarker(
            reservation.latitude,
            reservation.longitude,
            `${
                reservationIcon(
                    reservation.type
                )
            } ${
                reservation.title
            }`,
            reservation.location_name
        );

    }
);


places.forEach(
    place => {

        addMarker(
            place.latitude,
            place.longitude,
            `📍 ${place.name}`,
            place.address
        );

    }
);


renderMapList();
```

}

function renderMapList() {

```
const container =
    document.getElementById(
        "map-list"
    );

if (!container) {
    return;
}


const items = [];


items.push({

    title:
        "🏨 " +
        HOTEL.name,

    location:
        HOTEL.address

});


plans
    .filter(
        plan =>
            plan.latitude &&
            plan.longitude
    )
    .forEach(
        plan => {

            items.push({

                title:
                    "📅 " +
                    plan.title,

                location:
                    plan.location_name

            });

        }
    );


reservations
    .filter(
        reservation =>
            reservation.latitude &&
            reservation.longitude
    )
    .forEach(
        reservation => {

            items.push({

                title:
                    reservationIcon(
                        reservation.type
                    ) +
                    " " +
                    reservation.title,

                location:
                    reservation.location_name

            });

        }
    );


if (!items.length) {

    container.innerHTML =
        `
        <div class="empty">
            Todavía no hay lugares.
        </div>
        `;

    return;

}


container.innerHTML =
    items
        .map(
            item => `

                <div class="map-item">

                    <strong>
                        ${escapeHTML(
                            item.title
                        )}
                    </strong>

                    <span>
                        ${
                            escapeHTML(
                                item.location ||
                                ""
                            )
                        }
                    </span>

                </div>

            `
        )
        .join("");
```

}

const centerMap =
document.getElementById(
"center-map"
);

if (centerMap) {

```
centerMap.addEventListener(
    "click",
    () => {

        if (
            !navigator.geolocation
        ) {

            alert(
                "Este navegador no permite obtener tu ubicación."
            );

            return;

        }


        navigator.geolocation.getCurrentPosition(

            position => {

                initializeMap();


                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;


                map.setView(
                    [
                        lat,
                        lon
                    ],
                    15
                );


                L.circleMarker(
                    [
                        lat,
                        lon
                    ],
                    {
                        radius: 9
                    }
                )
                .addTo(
                    map
                )
                .bindPopup(
                    "📍 Estáis aquí"
                )
                .openPopup();

            },


            () => {

                alert(
                    "No se pudo obtener la ubicación."
                );

            }

        );

    }
);
```

}

// ==========================================
// BÚSQUEDA DE LUGARES — NOMINATIM
// ==========================================

async function searchLocation(
query,
resultContainerId,
onSelect
) {

```
const container =
    document.getElementById(
        resultContainerId
    );


if (!container) {
    return;
}


if (!query) {

    container.innerHTML =
        `
        <div class="empty">
            Escribe un lugar.
        </div>
        `;

    return;

}


container.innerHTML =
    `
    <div class="loading">
        🔎 Buscando...
    </div>
    `;


try {

    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=jsonv2" +
        "&limit=5" +
        "&q=" +
        encodeURIComponent(
            query +
            ", New York"
        );


    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Error buscando lugar"
        );

    }


    const results =
        await response.json();


    if (!results.length) {

        container.innerHTML =
            `
            <div class="empty">
                No hemos encontrado ese lugar.
            </div>
            `;

        return;

    }


    container.innerHTML =
        results
            .map(
                (
                    result,
                    index
                ) => `

                    <button
                        type="button"
                        class="search-result"
                        data-location-index="${index}"
                    >

                        <strong>
                            ${
                                escapeHTML(
                                    result.display_name
                                )
                            }
                        </strong>

                        <span>
                            Seleccionar
                        </span>

                    </button>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-location-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const result =
                            results[
                                Number(
                                    button
                                        .dataset
                                        .locationIndex
                                )
                            ];


                        const location = {

                            lat:
                                Number(
                                    result.lat
                                ),

                            lon:
                                Number(
                                    result.lon
                                ),

                            display_name:
                                result.display_name

                        };


                        onSelect(
                            location
                        );


                        if (
                            resultContainerId ===
                            "plan-location-results"
                        ) {

                            document
                                .getElementById(
                                    "plan-location"
                                )
                                .value =
                                result.display_name;

                        }


                        if (
                            resultContainerId ===
                            "reservation-location-results"
                        ) {

                            document
                                .getElementById(
                                    "reservation-location"
                                )
                                .value =
                                result.display_name;

                        }


                        container.innerHTML =
                            `
                                <div class="search-result">
                                    📍 Lugar seleccionado
                                </div>
                            `;

                    }
                );

            }
        );


} catch (error) {

    console.error(
        error
    );


    container.innerHTML =
        `
        <div class="empty">
            Error al buscar el lugar.
        </div>
        `;

}
```

}

// ==========================================
// VUELOS
// ==========================================

function renderFlights() {

```
const container =
    document.getElementById(
        "flight-list"
    );

if (!container) {
    return;
}


container.innerHTML =
    flights
        .map(
            flight => `

                <article class="flight-card">

                    <div class="card-main">

                        <span class="type-badge">
                            ✈️ ${
                                flight.airline
                            }
                        </span>

                        <strong>
                            ${
                                flight.flightNumber
                            }
                        </strong>

                        <div class="flight-route">

                            <span class="flight-airport">
                                ${
                                    flight.from
                                }
                            </span>

                            <span class="flight-arrow">
                                →
                            </span>

                            <span class="flight-airport">
                                ${
                                    flight.to
                                }
                            </span>

                        </div>

                        <p>
                            📅 ${
                                formatDate(
                                    flight.date
                                )
                            }
                        </p>

                        <p>
                            🕐 ${
                                flight.departure
                            }
                            →
                            ${
                                flight.arrival
                            }
                        </p>

                        <p>
                            ⏱️ ${
                                flight.duration
                            }
                        </p>

                    </div>

                </article>

            `
        )
        .join("");
```

}

// ==========================================
// REALTIME
// ==========================================

function subscribeRealtime() {

```
if (!currentUser) {
    return;
}


if (realtimeChannel) {

    try {

        db.removeChannel(
            realtimeChannel
        );

    } catch (error) {

        console.warn(
            error
        );

    }

}


realtimeChannel =
    db
        .channel(
            "ny-trip-live"
        )


        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "plans"
            },
            async () => {

                if (currentUser) {
                    await loadData();
                }

            }
        )


        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "reservations"
            },
            async () => {

                if (currentUser) {
                    await loadData();
                }

            }
        )


        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "expenses"
            },
            async () => {

                if (currentUser) {
                    await loadData();
                }

            }
        )


        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "places"
            },
            async () => {

                if (currentUser) {
                    await loadData();
                }

            }
        )


        .subscribe(
            status => {

                console.log(
                    "Realtime:",
                    status
                );

            }
        );
```

}

// ==========================================
// ELIMINAR SERVICE WORKERS ANTIGUOS
// ==========================================

async function removeOldServiceWorkers() {

```
if (
    !("serviceWorker" in navigator)
) {
    return;
}


try {

    const registrations =
        await navigator
            .serviceWorker
            .getRegistrations();


    for (
        const registration
        of registrations
    ) {

        await registration.unregister();

    }


    if (
        window.caches
    ) {

        const cacheNames =
            await caches.keys();


        await Promise.all(
            cacheNames.map(
                cacheName =>
                    caches.delete(
                        cacheName
                    )
            )
        );

    }


    console.log(
        "🧹 NY TRIP: caché eliminada."
    );


} catch (error) {

    console.warn(
        "No se pudo limpiar toda la caché:",
        error
    );

}
```

}

// ==========================================
// INICIAR APLICACIÓN
// ==========================================

let nyTripStarted = false;

async function startNYTrip() {

```
if (
    nyTripStarted
) {
    return;
}


if (!currentUser) {

    showLogin();

    return;

}


nyTripStarted =
    true;


console.log(
    "🗽 NY TRIP iniciando..."
);


updateCurrentUser();

updateTripDay();

renderFlights();


await removeOldServiceWorkers();

await loadWeather();

await loadCurrency();

await loadData();

subscribeRealtime();


console.log(
    "🟢 NY TRIP funcionando."
);
```

}

async function checkExistingSession() {

```
try {

    const {
        data,
        error
    } =
        await db.auth.getSession();


    if (error) {
        throw error;
    }


    if (
        data?.session?.user
    ) {

        currentUser =
            data.session.user;

        updateCurrentUser();

        showApp();

        await startNYTrip();

    } else {

        showLogin();

    }

} catch (error) {

    console.error(
        "Sesión:",
        error
    );

    currentUser =
        null;

    showLogin();

}
```

}

// ==========================================
// ARRANQUE
// ==========================================

async function initializeNYTrip() {

```
console.log(
    "🗽 NY TRIP cargando..."
);


initializeAuthentication();


showLogin();


await checkExistingSession();
```

}

if (
document.readyState ===
"loading"
) {

```
document.addEventListener(
    "DOMContentLoaded",
    initializeNYTrip
);
```

} else {

```
initializeNYTrip();
```

}
