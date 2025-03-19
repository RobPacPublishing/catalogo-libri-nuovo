// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOIp2reVVoeikYjZUk73yQpZNPaDVvCkw",
    authDomain: "aggiungilibri.firebaseapp.com",
    databaseURL: "https://aggiungilibri-default-rtdb.firebaseio.com",
    projectId: "aggiungilibri",
    storageBucket: "aggiungilibri.firebasestorage.app",
    messagingSenderId: "215130413037",
    appId: "1:215130413037:web:058d3395ddef3b7441f9e4"
};

// Inizializza Firebase
if (!firebase.apps.length) {
    console.log("Firebase SDK loaded?", typeof firebase !== "undefined");
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Selettori per gli elementi HTML
const libriDiv = document.getElementById("libri");
const infoContainer = document.getElementById("info-container");

// Controllo se gli elementi HTML sono presenti
if (!libriDiv) {
    console.error("Error: 'libri' element not found in index.html.");
}
if (!infoContainer) {
    console.error("Error: 'info-container' element not found in index.html.");
}

// Funzione per mostrare i libri nel catalogo
function mostraLibri() {
    const libriRef = firebase.database().ref("libri");
    libriRef.once("value").then(snapshot => {
        const libri = snapshot.val();
        libriDiv.innerHTML = ""; // Pulisce il contenitore prima di aggiornare

        if (libri) {
            Object.entries(libri).forEach(([id, libro]) => {
                // Creazione della card del libro
                const libroDiv = document.createElement("div");
                libroDiv.classList.add("section-libro");

                const immagine = document.createElement("img");
                immagine.src = libro.immagine || "placeholder.jpg";
                immagine.alt = libro.titolo;
                immagine.classList.add("img-libro");

                const titolo = document.createElement("h3");
                titolo.textContent = libro.titolo || "Title not available";

                const autore = document.createElement("p");
                autore.textContent = libro.autore ? "by " + libro.autore : "Unknown author";

                const prezzo = document.createElement("p");
                prezzo.innerHTML = libro.valuta && libro.prezzo ? `<b>from ${libro.valuta}${libro.prezzo}</b>` : "Price not available";

                const buyButton = document.createElement("button");
                buyButton.classList.add("buy-now-button");
                buyButton.textContent = "Buy now";
                if (libro.linkAmazon) {
                    buyButton.addEventListener("click", () => {
                        window.open(libro.linkAmazon, "_blank");
                    });
                } else {
                    buyButton.disabled = true;
                }

                // Aggiunge elementi alla card del libro
                libroDiv.appendChild(immagine);
                libroDiv.appendChild(titolo);
                libroDiv.appendChild(autore);
                libroDiv.appendChild(prezzo);
                libroDiv.appendChild(buyButton);

                // Aggiunge evento per mostrare dettagli
                libroDiv.addEventListener("click", () => mostraInfoLibro(id));

                // Aggiunge il libro al catalogo
                libriDiv.appendChild(libroDiv);
            });
        } else {
            libriDiv.innerHTML = "<p>No books available.</p>";
        }
    }).catch(error => {
        console.error("Error fetching books:", error);
    });
}

// Funzione per mostrare i dettagli di un libro
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;

        // Crea il container delle informazioni
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("info-libro");

        const closeButton = document.createElement("span");
        closeButton.classList.add("close-button");
        closeButton.innerHTML = "&times;";
        closeButton.addEventListener("click", () => {
            infoContainer.innerHTML = "";
        });

        const immagine = document.createElement("img");
        immagine.src = libro.immagine || "placeholder.jpg";
        immagine.alt = libro.titolo;

        const titolo = document.createElement("h3");
        titolo.textContent = libro.titolo || "Title not available";

        const autore = document.createElement("p");
        autore.textContent = libro.autore ? "by " + libro.autore : "Unknown author";

        const descrizione = document.createElement("p");
        descrizione.textContent = libro.descrizione || "No description available.";

        const prezzo = document.createElement("p");
        prezzo.innerHTML = libro.valuta && libro.prezzo ? `<b>from ${libro.valuta}${libro.prezzo}</b>` : "Price not available";

        const formati = document.createElement("p");
        formati.textContent = libro.formati ? "Available formats: " + libro.formati.join(", ") : "N/A";

        const buyButton = document.createElement("button");
        buyButton.classList.add("buy-now-button");
        buyButton.textContent = "Buy now";
        if (libro.linkAmazon) {
            buyButton.addEventListener("click", () => {
                window.open(libro.linkAmazon, "_blank");
            });
        } else {
            buyButton.disabled = true;
        }

        // Aggiunge gli elementi alla finestra di info
        infoDiv.appendChild(closeButton);
        infoDiv.appendChild(immagine);
        infoDiv.appendChild(titolo);
        infoDiv.appendChild(autore);
        infoDiv.appendChild(descrizione);
        infoDiv.appendChild(prezzo);
        infoDiv.appendChild(formati);
        infoDiv.appendChild(buyButton);

        // Mostra le informazioni
        infoContainer.innerHTML = "";
        infoContainer.appendChild(infoDiv);
    }).catch(error => {
        console.error("Error fetching book details:", error);
    });
}

// Funzione per caricare logo e banner
function mostraLogo() {
    const logo = localStorage.getItem("logo");
    if (logo) {
        document.getElementById("logo-catalogo").src = logo;
    }
}

function mostraBanner() {
    const banner = localStorage.getItem("banner");
    if (banner) {
        document.getElementById("banner-catalogo").src = banner;
    }
}

// Avvia il caricamento
mostraLibri();
mostraLogo();
mostraBanner();

