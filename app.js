// ==========================================
// 🗽 NY TRIP
// APLICACIÓN PRINCIPAL
// ==========================================


// ==========================================
// DATOS DEL VIAJE
// ==========================================

const tripData = {

    travelers: [
        {
            name: "Laura",
            emoji: "😈"
        },
        {
            name: "Sara",
            emoji: "😇"
        },
        {
            name: "Belén",
            emoji: "🤪"
        }
    ],

    dates: {
        start: "2026-12-26",
        end: "2027-01-04"
    },

    destination: "Nueva York, Estados Unidos",

    hotel: {
        name:
            "Courtyard by Marriott New York Manhattan Upper East Side",

        bookingUrl:
            "https://www.booking.com/hotel/us/manhattan-upper-east-side-courtyard-by-marriott.es.html"
    },

    flights: [

        {
            flightNumber: "EI583",
            airline: "Aer Lingus",
            from: "AGP",
            to: "DUB",
            fromName: "Málaga",
            toName: "Dublín",
            date: "2026-12-26",
            departure: "12:30",
            arrival: "14:45",
            duration: "3h 15m"
        },

        {
            flightNumber: "EI107",
            airline: "Aer Lingus",
            from: "DUB",
            to: "JFK",
            fromName: "Dublín",
            toName: "Nueva York",
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
            fromName: "Nueva York",
            toName: "Dublín",
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
            fromName: "Dublín",
            toName: "Málaga",
            date: "2027-01-05",
            departure: "07:10",
            arrival: "11:20",
            duration: "3h 10m"
        }

    ],

    days: [

        {
            date: "2026-12-26",
            title: "Llegada a Nueva York",
            items: [
                "✈️ Málaga → Dublín → JFK",
                "🏨 Llegada al hotel"
            ]
        },

        {
            date: "2026-12-27",
            title: "Nueva York",
            items: [
                "🗽 Día libre para descubrir la ciudad"
            ]
        },

        {
            date: "2026-12-28",
            title: "Nueva York",
            items: [
                "📍 Día pendiente de planificar"
            ]
        },

        {
            date: "2026-12-29",
            title: "Nueva York",
            items: [
                "📍 Día pendiente de planificar"
            ]
        },

        {
            date: "2026-12-30",
            title: "Nueva York",
            items: [
                "📍 Día pendiente de planificar"
            ]
        },

        {
            date: "2026-12-31",
            title: "Nochevieja 🎉",
            items: [
                "🎉 Nochevieja en Nueva York"
            ]
        },

        {
            date: "2027-01-01",
            title: "Año Nuevo 🎉",
            items: [
                "🗽 Primer día del año en Nueva York"
            ]
        },

        {
            date: "2027-01-02",
            title: "Nueva York",
            items: [
                "📍 Día pendiente de planificar"
            ]
        },

        {
            date: "2027-01-03",
            title: "Último día",
            items: [
                "🗽 Último día completo en Nueva York"
            ]
        },

        {
            date: "2027-01-04",
            title: "Regreso",
            items: [
                "✈️ JFK → Dublín"
            ]
        }

    ],

    places: [

        {
            name: "Courtyard by Marriott New York Manhattan Upper East Side",
            type: "🏨 Hotel"
        },

        {
            name: "JFK Airport",
            type: "✈️ Aeropuerto"
        }

    ]

};


// ==========================================
// DATOS LOCALES
// ==========================================

let expenses =
    loadLocalData(
        "nyTripExpenses",
        []
    );


let notes =
    loadLocalData(
        "nyTripNotes",
        ""
    );


// ==========================================
// LOCAL STORAGE
// ==========================================

function loadLocalData(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "NY TRIP: error leyendo datos locales.",
            error
        );

        return fallback;

    }

}


function saveLocalData(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "NY TRIP: error guardando datos locales.",
            error
        );

        return false;

    }

}


// ==========================================
// CONTADOR
// ==========================================

function updateTripDay() {

    const element =
        document.getElementById("trip-day");


    if (!element) {
        return;
    }


    const start =
        new Date(
            tripData.dates.start +
            "T00:00:00"
        );


    const end =
        new Date(
            tripData.dates.end +
            "T23:59:59"
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    if (today < start) {

        const difference =
            start.getTime() -
            today.getTime();


        const days =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );


        element.textContent =
            days === 1
                ? "FALTA 1 DÍA"
                : `FALTAN ${days} DÍAS`;

        return;

    }


    if (today <= end) {

        const difference =
            today.getTime() -
            start.getTime();


        const day =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1;


        const formattedDate =
            new Intl.DateTimeFormat(
                "es-ES",
                {
                    day: "numeric",
                    month: "long"
                }
            ).format(today);


        element.textContent =
            `DÍA ${day} · ${formattedDate}`;

        return;

    }


    element.textContent =
        "VIAJE FINALIZADO";

}


// ==========================================
// NAVEGACIÓN
// ==========================================

function showScreen(name) {

    const screens =
        document.querySelectorAll(".screen");


    screens.forEach(
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


    if (!target) {

        console.error(
            `NY TRIP: pantalla no encontrada: ${name}`
        );

        return;

    }


    target.classList.add("active");


    const navButtons =
        document.querySelectorAll(
            ".nav-button"
        );


    navButtons.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );

        }
    );


    const activeButton =
        document.querySelector(
            `.nav-button[data-screen="${name}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }


    window.scrollTo(
        0,
        0
    );


    if (name === "plan") {
        renderPlan();
    }


    if (name === "reservations") {
        renderReservations();
    }


    if (name === "expenses") {
        renderExpenses();
    }


    if (name === "travelers") {
        renderTravelers();
    }

}


// ==========================================
// PLAN
// ==========================================

function formatDate(dateString) {

    const date =
        new Date(
            dateString +
            "T12:00:00"
        );


    return new Intl.DateTimeFormat(
        "es-ES",
        {
            weekday: "long",
            day: "numeric",
            month: "long"
        }
    ).format(date);

}


function renderPlan() {

    const container =
        document.getElementById(
            "plan-content"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    tripData.days.forEach(
        (day) => {

            const card =
                document.createElement(
                    "section"
                );


            card.className =
                "section-card day-block";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "day-title";


            title.textContent =
                `${formatDate(day.date)} · ${day.title}`;


            card.appendChild(title);


            day.items.forEach(
                (item) => {

                    const activity =
                        document.createElement(
                            "div"
                        );


                    activity.className =
                        "activity";


                    const content =
                        document.createElement(
                            "div"
                        );


                    const strong =
                        document.createElement(
                            "strong"
                        );


                    strong.textContent =
                        item;


                    content.appendChild(
                        strong
                    );


                    activity.appendChild(
                        content
                    );


                    card.appendChild(
                        activity
                    );

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


// ==========================================
// RESERVAS
// ==========================================

function renderReservations() {

    const container =
        document.getElementById(
            "reservations-content"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const flightsCard =
        document.createElement(
            "section"
        );


    flightsCard.className =
        "reservation-card";


    flightsCard.innerHTML =
        "<h2>✈️ VUELOS</h2>";


    tripData.flights.forEach(
        (flight) => {

            const flightElement =
                document.createElement(
                    "div"
                );


            flightElement.className =
                "activity";


            flightElement.innerHTML = `

                <span class="activity-time">
                    ${formatShortDate(flight.date)}
                </span>

                <div>

                    <strong>
                        ${flight.flightNumber} · ${flight.airline}
                    </strong>

                    <div class="flight-route">
                        ${flight.from} → ${flight.to}
                    </div>

                    <div class="flight-meta">
                        ${flight.fromName} → ${flight.toName}<br>
                        🕐 ${flight.departure} → ${flight.arrival}<br>
                        ⏱️ ${flight.duration}
                    </div>

                </div>

            `;


            flightsCard.appendChild(
                flightElement
            );

        }
    );


    container.appendChild(
        flightsCard
    );


    const hotelCard =
        document.createElement(
            "section"
        );


    hotelCard.className =
        "reservation-card";


    hotelCard.innerHTML = `

        <h2>🏨 HOTEL</h2>

        <strong>
            ${tripData.hotel.name}
        </strong>

        <p class="flight-meta">
            📍 Nueva York, Estados Unidos<br>
            📅 26 diciembre 2026 → 4 enero 2027
        </p>

        <button
            class="primary-button"
            id="hotel-booking-button"
            type="button"
        >
            🔗 Ver reserva
        </button>

    `;


    container.appendChild(
        hotelCard
    );


    const hotelButton =
        document.getElementById(
            "hotel-booking-button"
        );


    if (hotelButton) {

        hotelButton.addEventListener(
            "click",
            () => {

                window.open(
                    tripData.hotel.bookingUrl,
                    "_blank"
                );

            }
        );

    }

}


function formatShortDate(dateString) {

    const date =
        new Date(
            dateString +
            "T12:00:00"
        );


    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "numeric",
            month: "short"
        }
    ).format(date);

}


// ==========================================
// GASTOS
// ==========================================

function renderExpenses() {

    const list =
        document.getElementById(
            "expenses-list"
        );


    const totalElement =
        document.getElementById(
            "expense-total"
        );


    if (!list || !totalElement) {
        return;
    }


    const total =
        expenses.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount),
            0
        );


    totalElement.textContent =
        `$${total.toFixed(2)}`;


    list.innerHTML = "";


    if (expenses.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <span>💸</span>

                <p>
                    Todavía no hay gastos.
                </p>

            </div>

        `;

        return;

    }


    expenses
        .slice()
        .reverse()
        .forEach(
            (expense) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "expense-item";


                item.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(
                                expense.description
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                expense.payer
                            )}
                        </small>

                    </div>

                    <div class="expense-right">

                        <strong>
                            $${Number(
                                expense.amount
                            ).toFixed(2)}
                        </strong>

                        <br>

                        <button
                            class="delete-expense"
                            data-expense-id="${expense.id}"
                            type="button"
                        >
                            Eliminar
                        </button>

                    </div>

                `;


                list.appendChild(
                    item
                );

            }
        );


    list
        .querySelectorAll(
            ".delete-expense"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteExpense(
                            button.dataset.expenseId
                        );

                    }
                );

            }
        );

}


function addExpense(
    description,
    amount,
    payer
) {

    expenses.push({

        id:
            Date.now().toString(),

        description,

        amount:
            Number(amount),

        payer,

        createdAt:
            new Date().toISOString()

    });


    saveLocalData(
        "nyTripExpenses",
        expenses
    );


    renderExpenses();

}


function deleteExpense(id) {

    expenses =
        expenses.filter(
            (expense) =>
                expense.id !== id
        );


    saveLocalData(
        "nyTripExpenses",
        expenses
    );


    renderExpenses();

}


// ==========================================
// VIAJERAS
// ==========================================

function renderTravelers() {

    const container =
        document.getElementById(
            "travelers-content"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    tripData.travelers.forEach(
        (traveler) => {

            const card =
                document.createElement(
                    "section"
                );


            card.className =
                "section-card";


            card.innerHTML = `

                <div class="traveler">

                    <div class="traveler-avatar">
                        ${traveler.emoji}
                    </div>

                    <div>

                        <strong>
                            ${traveler.name}
                        </strong>

                        <small>
                            Viajera de NY TRIP
                        </small>

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    const notesElement =
        document.getElementById(
            "trip-notes"
        );


    if (notesElement) {

        notesElement.value =
            notes;

    }

}


// ==========================================
// NOTAS
// ==========================================

function saveNotes() {

    const element =
        document.getElementById(
            "trip-notes"
        );


    const message =
        document.getElementById(
            "notes-message"
        );


    if (!element) {
        return;
    }


    notes =
        element.value;


    saveLocalData(
        "nyTripNotes",
        notes
    );


    if (message) {

        message.textContent =
            "✅ Notas guardadas en este dispositivo.";

    }

}


// ==========================================
// UBICACIÓN
// ==========================================

function requestLocation() {

    const result =
        document.getElementById(
            "location-result"
        );


    if (!result) {
        return;
    }


    if (!navigator.geolocation) {

        result.textContent =
            "❌ Este navegador no permite obtener la ubicación.";

        return;

    }


    result.textContent =
        "📍 Obteniendo ubicación...";


    navigator.geolocation.getCurrentPosition(

        (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            result.textContent =
                `📍 Ubicación detectada: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        },

        (error) => {

            console.error(
                "NY TRIP: error de ubicación.",
                error
            );


            result.textContent =
                "❌ No hemos podido obtener la ubicación. Comprueba los permisos del navegador.";

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );

}


// ==========================================
// INICIO
// ==========================================

function renderHome() {

    updateTripDay();


    const travelers =
        document.getElementById(
            "home-travelers"
        );


    if (travelers) {

        travelers.innerHTML = "";


        tripData.travelers.forEach(
            (traveler) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "traveler";


                element.innerHTML = `

                    <div class="traveler-avatar">
                        ${traveler.emoji}
                    </div>

                    <div>

                        <strong>
                            ${traveler.name}
                        </strong>

                        <small>
                            Viajera
                        </small>

                    </div>

                `;


                travelers.appendChild(
                    element
                );

            }
        );

    }


    const preview =
        document.getElementById(
            "home-plan-preview"
        );


    if (preview) {

        preview.innerHTML = "";


        tripData.days
            .slice(0, 3)
            .forEach(
                (day) => {

                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "activity";


                    element.innerHTML = `

                        <span class="activity-time">
                            ${formatShortDate(day.date)}
                        </span>

                        <div>

                            <strong>
                                ${day.title}
                            </strong>

                            <p>
                                ${day.items[0]}
                            </p>

                        </div>

                    `;


                    preview.appendChild(
                        element
                    );

                }
            );

    }

}


// ==========================================
// SEGURIDAD PARA TEXTO DEL USUARIO
// ==========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// EVENTOS
// ==========================================

function setupEvents() {

    document
        .querySelectorAll(
            "[data-screen]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    () => {

                        showScreen(
                            element.dataset.screen
                        );

                    }
                );

            }
        );


    const expenseForm =
        document.getElementById(
            "expense-form"
        );


    if (expenseForm) {

        expenseForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const description =
                    document
                        .getElementById(
                            "expense-description"
                        )
                        .value
                        .trim();


                const amount =
                    document
                        .getElementById(
                            "expense-amount"
                        )
                        .value;


                const payer =
                    document
                        .getElementById(
                            "expense-payer"
                        )
                        .value;


                if (
                    !description ||
                    !amount ||
                    Number(amount) <= 0
                ) {

                    return;

                }


                addExpense(
                    description,
                    amount,
                    payer
                );


                expenseForm.reset();

            }
        );

    }


    const locationButton =
        document.getElementById(
            "location-button"
        );


    if (locationButton) {

        locationButton.addEventListener(
            "click",
            requestLocation
        );

    }


    const notesButton =
        document.getElementById(
            "save-notes"
        );


    if (notesButton) {

        notesButton.addEventListener(
            "click",
            saveNotes
        );

    }

}


// ==========================================
// ARRANCAR
// ==========================================

function startNYTrip() {

    console.log(
        "🗽 NY TRIP funcionando correctamente."
    );


    renderHome();

    setupEvents();

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startNYTrip
    );

} else {

    startNYTrip();

}
