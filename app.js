// ==========================================
// 🗽 NY TRIP
// Almacenamiento local
// ==========================================

// Datos iniciales del viaje
const defaultTripData = {
    travelers: [
        {
            id: 1,
            name: "Ana"
        },
        {
            id: 2,
            name: "Juan"
        },
        {
            id: 3,
            name: "Pedro"
        }
    ],

    dates: {
        start: "2026-12-26",
        end: "2027-01-04"
    },

    destination: "Nueva York, Estados Unidos",

    hotel: null,

    flights: [],

    itinerary: [],

    reservations: [],

    expenses: [],

    preferences: {}
};


// ==========================================
// GUARDAR DATOS
// ==========================================

function saveTripData(data) {
    localStorage.setItem(
        "nyTripData",
        JSON.stringify(data)
    );
}


// ==========================================
// CARGAR DATOS
// ==========================================

function loadTripData() {

    const savedData =
        localStorage.getItem("nyTripData");

    if (!savedData) {

        saveTripData(defaultTripData);

        return defaultTripData;
    }

    try {

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            "No se pudieron leer los datos guardados.",
            error
        );

        saveTripData(defaultTripData);

        return defaultTripData;
    }
}


// ==========================================
// DATOS DEL VIAJE EN MEMORIA
// ==========================================

let tripData = loadTripData();


// ==========================================
// FUNCIONES PARA FUTURAS VERSIONES
// ==========================================

function addItineraryItem(item) {

    tripData.itinerary.push(item);

    saveTripData(tripData);
}


function addReservation(reservation) {

    tripData.reservations.push(reservation);

    saveTripData(tripData);
}


function addExpense(expense) {

    tripData.expenses.push(expense);

    saveTripData(tripData);
}


// ==========================================
// COMPROBACIÓN
// ==========================================

console.log("🗽 NY TRIP iniciado.");

console.log(
    "Viaje:",
    tripData.destination
);

console.log(
    "Viajeros:",
    tripData.travelers
);

console.log(
    "Fechas:",
    tripData.dates
);
