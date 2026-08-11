// ==========================================
// 🗽 NY TRIP
// ==========================================

const tripData = {

travelers: [
    "Laura",
    "Sara",
    "Belén"
],

dates: {
    start: "2026-12-26",
    end: "2027-01-04"
},

destination: "Nueva York, Estados Unidos",

hotel: {
    name: "Courtyard by Marriott New York Manhattan Upper East Side",
    bookingUrl: "https://www.booking.com/hotel/us/manhattan-upper-east-side-courtyard-by-marriott.es.html"
},

flights: [
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
]

};

// ==========================================
// GUARDAR DATOS DEL VIAJE
// ==========================================

try {

localStorage.setItem(
    "nyTripData",
    JSON.stringify(tripData)
);

} catch (error) {

console.error(
    "NY TRIP: error guardando datos.",
    error
);

}

// ==========================================
// CUENTA ATRÁS
// ==========================================

function updateTripDay() {

const element =
    document.getElementById("trip-day");

if (!element) {
    return;
}

const start =
    new Date("2026-12-26T00:00:00");

const end =
    new Date("2027-01-04T23:59:59");

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
        "FALTAN " + days + " DÍAS";

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
        "DÍA " +
        day +
        " · " +
        formattedDate;

    return;
}


element.textContent =
    "VIAJE FINALIZADO";

}

// ==========================================
// TIEMPO — NUEVA YORK
// ==========================================

async function loadWeather() {

const temperature =
    document.getElementById(
        "weather-temperature"
    );

const description =
    document.getElementById(
        "weather-description"
    );

if (!temperature || !description) {
    return;
}


try {

    const url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=40.7128" +
        "&longitude=-74.0060" +
        "&current=temperature_2m,weather_code,wind_speed_10m" +
        "&timezone=America%2FNew_York";

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Error consultando Open-Meteo"
        );
    }

    const data =
        await response.json();


    const current =
        data.current;


    temperature.textContent =
        Math.round(
            current.temperature_2m
        ) +
        " °C";


    description.textContent =
        getWeatherDescription(
            current.weather_code
        ) +
        " · Viento " +
        Math.round(
            current.wind_speed_10m
        ) +
        " km/h";


} catch (error) {

    console.error(
        "NY TRIP: no se pudo cargar el tiempo.",
        error
    );

    temperature.textContent =
        "No disponible";

    description.textContent =
        "Comprueba tu conexión a Internet.";

}

}

// ==========================================
// DESCRIPCIÓN DEL TIEMPO
// ==========================================

function getWeatherDescription(code) {

const descriptions = {

    0: "☀️ Despejado",

    1: "🌤️ Mayormente despejado",

    2: "⛅ Parcialmente nublado",

    3: "☁️ Nublado",

    45: "🌫️ Niebla",

    48: "🌫️ Niebla",

    51: "🌦️ Llovizna",

    53: "🌦️ Llovizna",

    55: "🌧️ Llovizna intensa",

    61: "🌧️ Lluvia ligera",

    63: "🌧️ Lluvia",

    65: "🌧️ Lluvia intensa",

    71: "🌨️ Nieve ligera",

    73: "🌨️ Nieve",

    75: "❄️ Nieve intensa",

    80: "🌦️ Chubascos",

    81: "🌦️ Chubascos",

    82: "🌧️ Chubascos intensos",

    95: "⛈️ Tormenta",

    96: "⛈️ Tormenta con granizo",

    99: "⛈️ Tormenta intensa"

};

return (
    descriptions[code] ||
    "🌡️ Condiciones variables"
);

}

// ==========================================
// GASTOS
// ==========================================

const EXPENSES_KEY =
"nyTripExpenses";

const PEOPLE = [
"Laura",
"Sara",
"Belén"
];

let expenses = [];

// ==========================================
// CARGAR GASTOS
// ==========================================

function loadExpenses() {

try {

    const saved =
        localStorage.getItem(
            EXPENSES_KEY
        );

    if (saved) {

        expenses =
            JSON.parse(saved);

    }

} catch (error) {

    console.error(
        "NY TRIP: error cargando gastos.",
        error
    );

    expenses = [];

}

}

// ==========================================
// GUARDAR GASTOS
// ==========================================

function saveExpenses() {

localStorage.setItem(
    EXPENSES_KEY,
    JSON.stringify(expenses)
);

}

// ==========================================
// OBTENER TIPO DE CAMBIO
// ==========================================

async function getEURtoUSD() {

try {

    const response =
        await fetch(
            "https://api.frankfurter.dev/v2/rate/EUR/USD"
        );

    if (!response.ok) {

        throw new Error(
            "No se pudo obtener EUR/USD"
        );

    }

    const data =
        await response.json();

    return Number(
        data.rate
    );

} catch (error) {

    console.error(
        "NY TRIP: error obteniendo EUR/USD.",
        error
    );

    return null;

}

}

// ==========================================
// CONVERTIR A EUROS
// ==========================================

async function convertToEUR(
amount,
currency
) {

if (currency === "EUR") {

    return Number(amount);

}


const rate =
    await getEURtoUSD();


if (!rate) {

    throw new Error(
        "No se pudo obtener el cambio EUR/USD."
    );

}


return Number(amount) / rate;

}

// ==========================================
// AÑADIR GASTO
// ==========================================

async function addExpense(event) {

event.preventDefault();


const description =
    document.getElementById(
        "expense-description"
    ).value.trim();


const amount =
    Number(
        document.getElementById(
            "expense-amount"
        ).value
    );


const currency =
    document.getElementById(
        "expense-currency"
    ).value;


const payer =
    document.getElementById(
        "expense-payer"
    ).value;


const participants =
    Array.from(
        document.querySelectorAll(
            'input[name="participant"]:checked'
        )
    ).map(
        input => input.value
    );


if (!description) {

    alert(
        "Escribe el concepto del gasto."
    );

    return;

}


if (!amount || amount <= 0) {

    alert(
        "Introduce un importe válido."
    );

    return;

}


if (participants.length === 0) {

    alert(
        "Selecciona al menos una viajera."
    );

    return;

}


const button =
    event.target.querySelector(
        'button[type="submit"]'
    );


if (button) {

    button.disabled = true;

    button.textContent =
        "Guardando...";

}


try {

    const amountEUR =
        await convertToEUR(
            amount,
            currency
        );


    const expense = {

        id:
            Date.now(),

        description:
            description,

        originalAmount:
            amount,

        currency:
            currency,

        amountEUR:
            Number(
                amountEUR.toFixed(2)
            ),

        payer:
            payer,

        participants:
            participants,

        date:
            new Date().toISOString()

    };


    expenses.push(
        expense
    );


    saveExpenses();

    renderExpenses();

    event.target.reset();


    document
        .querySelectorAll(
            'input[name="participant"]'
        )
        .forEach(
            input => {
                input.checked = true;
            }
        );


    event.target.classList.add(
        "hidden"
    );


} catch (error) {

    console.error(error);

    alert(
        "No se pudo guardar el gasto. Comprueba tu conexión."
    );

} finally {

    if (button) {

        button.disabled = false;

        button.textContent =
            "💾 Guardar gasto";

    }

}

}

// ==========================================
// BORRAR GASTO
// ==========================================

function deleteExpense(id) {

const confirmed =
    confirm(
        "¿Quieres borrar este gasto?"
    );


if (!confirmed) {
    return;
}


expenses =
    expenses.filter(
        expense =>
            expense.id !== id
    );


saveExpenses();

renderExpenses();

}

// ==========================================
// CALCULAR SALDOS
// ==========================================

function calculateBalances() {

const balances = {

    Laura: 0,

    Sara: 0,

    Belén: 0

};


expenses.forEach(
    expense => {

        const participants =
            expense.participants;


        const share =
            expense.amountEUR /
            participants.length;


        participants.forEach(
            person => {

                balances[person] -=
                    share;

            }
        );


        balances[expense.payer] +=
            expense.amountEUR;

    }
);


return balances;

}

// ==========================================
// CALCULAR QUIÉN DEBE A QUIÉN
// ==========================================

function calculateDebts() {

const balances =
    calculateBalances();


const creditors = [];

const debtors = [];


PEOPLE.forEach(
    person => {

        const balance =
            balances[person];


        if (balance > 0.01) {

            creditors.push({

                person:
                    person,

                amount:
                    balance

            });

        }


        if (balance < -0.01) {

            debtors.push({

                person:
                    person,

                amount:
                    Math.abs(balance)

            });

        }

    }
);


const debts = [];


let creditorIndex = 0;

let debtorIndex = 0;


while (
    creditorIndex <
        creditors.length &&
    debtorIndex <
        debtors.length
) {

    const creditor =
        creditors[creditorIndex];

    const debtor =
        debtors[debtorIndex];


    const amount =
        Math.min(
            creditor.amount,
            debtor.amount
        );


    debts.push({

        from:
            debtor.person,

        to:
            creditor.person,

        amount:
            Number(
                amount.toFixed(2)
            )

    });


    creditor.amount -=
        amount;

    debtor.amount -=
        amount;


    if (
        creditor.amount <
        0.01
    ) {

        creditorIndex++;

    }


    if (
        debtor.amount <
        0.01
    ) {

        debtorIndex++;

    }

}


return debts;

}

// ==========================================
// MOSTRAR GASTOS
// ==========================================

function renderExpenses() {

const totalElement =
    document.getElementById(
        "total-expenses"
    );


const listElement =
    document.getElementById(
        "expenses-list"
    );


const balancesElement =
    document.getElementById(
        "balances-container"
    );


const debtsElement =
    document.getElementById(
        "debts-container"
    );


if (
    !totalElement ||
    !listElement ||
    !balancesElement ||
    !debtsElement
) {

    return;

}


const total =
    expenses.reduce(
        (
            sum,
            expense
        ) =>
            sum +
            expense.amountEUR,
        0
    );


totalElement.textContent =
    formatEUR(total);


// -----------------------------
// LISTA DE GASTOS
// -----------------------------

if (expenses.length === 0) {

    listElement.innerHTML =
        "<p>No hay gastos todavía.</p>";

} else {

    listElement.innerHTML =
        expenses
            .slice()
            .reverse()
            .map(
                expense => {

                    const share =
                        expense.amountEUR /
                        expense.participants.length;


                    return `

                        <div class="expense-item">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        expense.description
                                    )}
                                </strong>

                                <p>
                                    Pagó ${escapeHTML(
                                        expense.payer
                                    )}
                                    ·
                                    ${formatEUR(
                                        expense.amountEUR
                                    )}

                                </p>

                                <small>
                                    ${expense.participants.join(
                                        ", "
                                    )}
                                    ·
                                    ${formatEUR(
                                        share
                                    )}
                                    por persona
                                </small>

                            </div>


                            <button
                                type="button"
                                class="delete-expense"
                                data-id="${expense.id}"
                            >
                                🗑️
                            </button>

                        </div>

                    `;

                }
            )
            .join("");

}


// -----------------------------
// SALDOS
// -----------------------------

const balances =
    calculateBalances();


balancesElement.innerHTML =
    PEOPLE
        .map(
            person => {

                const balance =
                    balances[person];


                let text;

                if (
                    Math.abs(balance) <
                    0.01
                ) {

                    text =
                        "Está a cero";

                } else if (
                    balance > 0
                ) {

                    text =
                        "Debe recibir " +
                        formatEUR(
                            balance
                        );

                } else {

                    text =
                        "Debe pagar " +
                        formatEUR(
                            Math.abs(balance)
                        );

                }


                return `

                    <div class="balance-item">

                        <strong>
                            ${person}
                        </strong>

                        <span>
                            ${text}
                        </span>

                    </div>

                `;

            }
        )
        .join("");


// -----------------------------
// DEUDAS
// -----------------------------

const debts =
    calculateDebts();


if (debts.length === 0) {

    debtsElement.innerHTML = `

        <div class="debt-success">

            ✅

            <strong>
                Estáis a mano
            </strong>

            <p>
                Nadie debe dinero a nadie.
            </p>

        </div>

    `;

} else {

    debtsElement.innerHTML = `

        <h3>
            💸 ¿QUIÉN DEBE A QUIÉN?
        </h3>

        ${debts
            .map(
                debt => `

                    <div class="debt-item">

                        <span>
                            ${getPersonEmoji(
                                debt.from
                            )}
                            <strong>
                                ${debt.from}
                            </strong>
                        </span>

                        <span>
                            debe
                        </span>

                        <span>
                            ${getPersonEmoji(
                                debt.to
                            )}
                            <strong>
                                ${debt.to}
                            </strong>
                        </span>

                        <strong class="debt-amount">
                            ${formatEUR(
                                debt.amount
                            )}
                        </strong>

                    </div>

                `
            )
            .join("")}

    `;

}


// -----------------------------
// BOTONES BORRAR
// -----------------------------

document
    .querySelectorAll(
        ".delete-expense"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    deleteExpense(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        }
    );

}

// ==========================================
// FORMATO DE EUROS
// ==========================================

function formatEUR(amount) {

return new Intl.NumberFormat(
    "es-ES",
    {
        style: "currency",
        currency: "EUR"
    }
).format(amount);

}

// ==========================================
// EMOJIS
// ==========================================

function getPersonEmoji(
person
) {

const emojis = {

    Laura: "😈",

    Sara: "😇",

    Belén: "🤪"

};


return (
    emojis[person] ||
    "👤"
);

}

// ==========================================
// EVITAR HTML INYECTADO
// ==========================================

function escapeHTML(
value
) {

return String(value)
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

// ==========================================
// INTERFAZ GASTOS
// ==========================================

function setupExpenseUI() {

const showButton =
    document.getElementById(
        "show-expense-form"
    );


const form =
    document.getElementById(
        "expense-form"
    );


const cancelButton =
    document.getElementById(
        "cancel-expense"
    );


if (
    !showButton ||
    !form ||
    !cancelButton
) {

    return;

}


showButton.addEventListener(
    "click",
    () => {

        form.classList.remove(
            "hidden"
        );

        showButton.classList.add(
            "hidden"
        );

    }
);


cancelButton.addEventListener(
    "click",
    () => {

        form.reset();

        document
            .querySelectorAll(
                'input[name="participant"]'
            )
            .forEach(
                input => {
                    input.checked = true;
                }
            );


        form.classList.add(
            "hidden"
        );

        showButton.classList.remove(
            "hidden"
        );

    }
);


form.addEventListener(
    "submit",
    addExpense
);

}

// ==========================================
// NAVEGACIÓN
// ==========================================

function setupNavigation() {

const expensesButton =
    document.getElementById(
        "btn-expenses"
    );


const navExpenses =
    document.getElementById(
        "nav-expenses"
    );


const expensesSection =
    document.getElementById(
        "expenses-section"
    );


function showExpenses() {

    if (!expensesSection) {
        return;
    }

    expensesSection.scrollIntoView({
        behavior: "smooth"
    });

}


if (expensesButton) {

    expensesButton.addEventListener(
        "click",
        showExpenses
    );

}


if (navExpenses) {

    navExpenses.addEventListener(
        "click",
        showExpenses
    );

}


const weatherButton =
    document.getElementById(
        "btn-weather"
    );


if (weatherButton) {

    weatherButton.addEventListener(
        "click",
        () => {

            const section =
                document.querySelector(
                    ".now-card"
                );

            if (section) {

                section.scrollIntoView({
                    behavior:
                        "smooth"
                });

            }

        }
    );

}

}

// ==========================================
// INICIAR
// ==========================================

function startNYTrip() {

console.log(
    "🗽 NY TRIP funcionando correctamente."
);


updateTripDay();

loadExpenses();

renderExpenses();

setupExpenseUI();

setupNavigation();

loadWeather();

}

// ==========================================
// DOM
// ==========================================

if (
document.readyState ===
"loading"
) {

document.addEventListener(
    "DOMContentLoaded",
    startNYTrip
);

} else {

startNYTrip();

}
