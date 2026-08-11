// ==========================================
// 🗽 NY TRIP
// Datos, almacenamiento y actualización
// ==========================================


// ==========================================
// DATOS INICIALES DEL VIAJE
// ==========================================

const defaultTripData = {

    travelers: [
        {
            id: 1,
            name: "Laura"
        },
        {
            id: 2,
            name: "Sara"
        },
        {
            id: 3,
            name: "Belén"
        }
    ],

    dates: {
        start: "2026-12-26",
        end: "2027-01-04"
    },

    destination: "Nueva York, Estados Unidos",

    hotel: {
        name: "Courtyard by Marriott New York Manhattan Upper East Side",

        bookingUrl:
            "https://www.booking.com/hotel/us/manhattan-upper-east-side-courtyard-by-marriott.es.html",

        address: "",

        checkIn: "2026-12-26",

        checkOut: "2027-01-04",

        notes: ""
    },

    flights: [

        {
            type: "outbound",

            date: "2026-12-26",

            airline: "Aer Lingus",

            flightNumber: "EI583",

            departure: {
                airport: "AGP",
                airportName: "Málaga Airport",
                date: "2026-12-26",
                time: "12:30"
            },

            arrival: {
                airport: "DUB",
                airportName: "Dublin Airport",
                date: "2026-12-26",
                time: "14:45"
            },

            cabin: "Economy",

            duration: "3h 15m",

            bookingReference: "3I8MQN"
        },

        {
            type: "outbound",

            date: "2026-12-26",

            airline: "Aer Lingus",

            flightNumber: "EI107",

            departure: {
                airport: "DUB",
                airportName: "Dublin Airport",
                date: "2026-12-26",
                time: "16:45"
            },

            arrival: {
                airport: "JFK",
                airportName:
                    "John F. Kennedy International Airport",
                date: "2026-12-26",
                time: "19:25"
            },

            cabin: "Economy",

            duration: "7h 40m",

            bookingReference: "3I8MQN"
        },

        {
            type: "layover",

            airport: "DUB",

            airportName: "Dublin Airport",

            duration: "2h"
        },

        {
            type: "return",

            date: "2027-01-04",

            airline: "Aer Lingus",

            flightNumber: "EI104",

            departure: {
                airport: "JFK",
                airportName:
                    "John F. Kennedy International Airport",
                date: "2027-01-04",
                time: "17:00"
            },

            arrival: {
                airport: "DUB",
                airportName: "Dublin Airport",
                date: "2027-01-05",
                time: "04:20"
            },

            cabin: "Economy",

            duration: "6h 20m",

            bookingReference: "3I8MQN"
        },

        {
            type: "layover",

            airport: "DUB",

            airportName: "Dublin Airport",

            duration: "2h 50m"
        },

        {
            type: "return",

            date: "2027-01-05",

            airline: "Aer Lingus",

            flightNumber: "EI582",

            departure: {
                airport: "DUB",
                airportName: "Dublin Airport",
                date: "2027-01-05",
                time: "07:10"
            },

            arrival: {
                airport: "AGP",
                airportName: "Málaga Airport",
                date: "2027-01-05",
                time: "11:20"
            },

            cabin: "Economy",

            duration: "3h 10m",

            bookingReference: "3I8MQN"
        }

    ],

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

        const existingData =
            JSON.parse(savedData);

        return existingData;

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
// DATOS ACTUALES
// ==========================================

let tripData = loadTripData();


// ==========================================
// ACTUALIZAR DATOS DEL VIAJE
// ==========================================

// Conservamos los datos que ya existan.
// Solo añadimos la información nueva.

let dataWasUpdated = false;


// Viajeros

if (
    !tripData.travelers ||
    tripData.travelers.length === 0
) {

    tripData.travelers =
        defaultTripData.travelers;

    dataWasUpdated = true;
}


// Hotel

if (
    !tripData.hotel ||
    !tripData.hotel.name
) {

    tripData.hotel =
        defaultTripData.hotel;

    dataWasUpdated = true;
}


// Vuelos

if (
    !tripData.flights ||
    tripData.flights.length === 0
) {

    tripData.flights =
        defaultTripData.flights;

    dataWasUpdated = true;
}


// Fechas

if (!tripData.dates) {

    tripData.dates =
        defaultTripData.dates;

    dataWasUpdated = true;
}


// Destino

if (!tripData.destination) {

    tripData.destination =
        defaultTripData.destination;

    dataWasUpdated = true;
}


// Itinerario

if (!tripData.itinerary) {

    tripData.itinerary = [];

    dataWasUpdated = true;
}


// Reservas

if (!tripData.reservations) {

    tripData.reservations = [];

    dataWasUpdated = true;
}


// Gastos

if (!tripData.expenses) {

    tripData.expenses = [];

    dataWasUpdated = true;
}


// Preferencias

if (!tripData.preferences) {

    tripData.preferences = {};

    dataWasUpdated = true;
}


// Guardamos solo si hubo cambios.

if (dataWasUpdated) {

    saveTripData(tripData);

    console.log(
        "🟢 NY TRIP: datos actualizados."
    );
}


// ==========================================
// CALCULAR EL DÍA DEL VIAJE
// ==========================================

function getTripDay(date = new Date()) {

    const start =
        new Date(
            tripData.dates.start + "T00:00:00"
        );

    const end =
        new Date(
            tripData.dates.end + "T23:59:59"
        );


    if (date < start) {

        return {
            status: "before",
            day: 0,
            date: date
        };
    }


    if (date > end) {

        return {
            status: "after",
            day: null,
            date: date
        };
    }


    const millisecondsPerDay =
        1000 * 60 * 60 * 24;


    const difference =
        date.getTime() - start.getTime();


    const day =
        Math.floor(
            difference / millisecondsPerDay
        ) + 1;


    return {
        status: "during",
        day: day,
        date: date
    };
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatTripDate(date) {

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


// ==========================================
// AÑADIR ACTIVIDAD
// ==========================================

function addItineraryItem(item) {

    tripData.itinerary.push(item);

    saveTripData(tripData);
}


// ==========================================
// AÑADIR RESERVA
// ==========================================

function addReservation(reservation) {

    tripData.reservations.push(reservation);

    saveTripData(tripData);
}


// ==========================================
// AÑADIR GASTO
// ==========================================

function addExpense(expense) {

    tripData.expenses.push(expense);

    saveTripData(tripData);
}


// ==========================================
// COMPROBACIÓN
// ==========================================

const currentTripDay =
    getTripDay();


console.log(
    "🗽 NY

