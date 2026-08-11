// ==========================================
// 🗽 NY TRIP
// ==========================================

// DATOS DEL VIAJE

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

    console.log("🟢 NY TRIP: datos guardados.");

} catch (error) {

    console.error(
        "🔴 NY TRIP: no se pudieron guardar los datos.",
        error
    );

}


// ==========================================
// CALCULAR LOS DÍAS QUE FALTAN
// ==========================================

function updateTripDay() {

    const element =
        document.getElementById("trip-day");


    if (!element) {

        console.error(
            "🔴 NY TRIP: no encuentro el elemento trip-day."
        );

        return;

    }


    const start =
        new Date(
            tripData.dates.start + "T00:00:00"
        );


    const end =
        new Date(
            tripData.dates.end + "T23:59:59"
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    // ANTES DEL VIAJE

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
            "FALTAN " +
            days +
            " DÍAS";


        console.log(
            "🟢 NY TRIP: faltan " +
            days +
            " días."
        );


        return;

    }


    // DURANTE EL VIAJE

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


    // DESPUÉS DEL VIAJE

    element.textContent =
        "VIAJE FINALIZADO";

}


// ==========================================
// INICIAR APLICACIÓN
// ==========================================

function startNYTrip() {

    console.log(
        "🗽 NY TRIP funcionando correctamente."
    );


    updateTripDay();

}


// ==========================================
// ESPERAR A QUE HTML ESTÉ CARGADO
// ==========================================

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
// ==========================================
// 📋 PANTALLA DE RESERVAS
// ==========================================

function openReservations() {

    const homeScreen =
        document.getElementById("home-screen");

    const reservationsScreen =
        document.getElementById("reservations-screen");

    const bottomNavigation =
        document.getElementById("bottom-navigation");


    if (!homeScreen || !reservationsScreen) {
        return;
    }


    homeScreen.style.display = "none";

    reservationsScreen.style.display = "block";


    if (bottomNavigation) {
        bottomNavigation.style.display = "none";
    }


    window.scrollTo(0, 0);

}


// ==========================================
// VOLVER AL INICIO
// ==========================================

function closeReservations() {

    const homeScreen =
        document.getElementById("home-screen");

    const reservationsScreen =
        document.getElementById("reservations-screen");

    const bottomNavigation =
        document.getElementById("bottom-navigation");


    if (!homeScreen || !reservationsScreen) {
        return;
    }


    reservationsScreen.style.display = "none";

    homeScreen.style.display = "block";


    if (bottomNavigation) {
        bottomNavigation.style.display = "flex";
    }


    window.scrollTo(0, 0);

}


// ==========================================
// ENLACE DEL HOTEL
// ==========================================

function openHotelBooking() {

    if (
        typeof tripData !== "undefined" &&
        tripData.hotel &&
        tripData.hotel.bookingUrl
    ) {

        window.open(
            tripData.hotel.bookingUrl,
            "_blank"
        );

    }

}


// ==========================================
// ACTIVAR BOTONES
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const reservationsButton =
            document.getElementById(
                "btn-reservations"
            );


        const backButton =
            document.getElementById(
                "btn-back-reservations"
            );


        const hotelButton =
            document.getElementById(
                "btn-hotel-booking"
            );


        if (reservationsButton) {

            reservationsButton.addEventListener(
                "click",
                openReservations
            );

        }


        if (backButton) {

            backButton.addEventListener(
                "click",
                closeReservations
            );

        }


        if (hotelButton) {

            hotelButton.addEventListener(
                "click",
                openHotelBooking
            );

        }

    }
);

