// ==========================================
// 🗽 NY TRIP
// Datos, almacenamiento y día del viaje
// ==========================================


// ==========================================
// DATOS INICIALES
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
        name:
            "Courtyard by Marriott New York Manhattan Upper East Side",

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
// GUARDAR
// ==========================================

function saveTripData(data) {

    localStorage.setItem(
        "nyTripData",
        JSON.stringify(data)
    );
}


// ==========================================
// CARGAR
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
            "Error leyendo los datos guardados.",
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
// ASEGURAR DATOS IMPORTANTES
// ==========================================

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


if (dataWasUpdated) {

    saveTripData(tripData);

}


// ==========================================
// CALCULAR DÍA DEL VIAJE
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


    // Antes del viaje

    if (date < start) {

        return {
            status: "before",
            day: 0,
            date: date
        };
    }


    // Después del viaje

    if (date > end) {

        return {
            status: "after",
            day: null,
            date: date
        };
    }


    // Durante el viaje

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

function formatDayAndMonth(date) {

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "numeric",
            month: "long"
        }
    ).format(date);
}


// ==========================================
// MOSTRAR EL DÍA EN LA PANTALLA
// ==========================================

function updateTripDayOnScreen() {

    const element =
        document.getElementById(
            "trip-day"
        );

    if (!element) {
        return;
    }


    const trip =
        getTripDay();


    // Antes del viaje

    if (trip.status === "before") {

        const start =
            new Date(
                tripData.dates.start +
                "T00:00:00"
            );

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            start.getTime() -
            today.getTime();


        const daysLeft =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );


        element.textContent =
            `FALTAN ${daysLeft} DÍAS`;

        return;
    }


    // Durante el viaje

    if (trip.status === "during") {

        const dateText =
            formatDayAndMonth(
                trip.date
            );

        element.textContent =
            `DÍA ${trip.day} · ${dateText}`;

        return;
    }


    // Después del viaje

    element.textContent =
        "VIAJE FINALIZADO";
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

    tripData.reservations.push(
        reservation
    );

    saveTripData(tripData);
}


// ==========================================
// AÑADIR GASTO
// ==========================================

function addExpense(expense) {

    tripData.expenses.push(
        expense
    );

    saveTripData(tripData);
}


// ==========================================
// INICIAR APLICACIÓN
// ==========================================

function startNYTrip() {

    console.log(
        "🗽 NY TRIP iniciado."
    );

    console.log(
        "👥 Viajeros:",
        tripData.travelers
    );

    console.log(
        "🏨 Hotel:",
        tripData.hotel
    );

    console.log(
        "✈️ Vuelos:",
        tripData.flights
    );

    console.log(
        "📅 Fechas:",
        tripData.dates
    );


    updateTripDayOnScreen();
}


// ==========================================
// ESPERAR A QUE CARGUE LA PÁGINA
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
