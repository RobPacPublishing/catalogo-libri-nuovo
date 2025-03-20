// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOIp2reVVoeikYjZUk73yQpZNPaDVvCkw",
    authDomain: "aggiungilibri.firebaseapp.com",
    databaseURL: "https://aggiungilibri-default-rtdb.firebaseio.com",
    projectId: "aggiungilibri",
    storageBucket: "aggiungilibri.appspot.com",
    messagingSenderId: "215130413037",
    appId: "1:215130413037:web:058d3395ddef3b7441f9e4"
};

// Inizializzazione Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Selettori per gli elementi HTML
const libriDiv = document.getElementById("libri");
const popupContainer = document.getElementById("book-popup");
const popupImage = document.getElementById("popup-image");
const popupTitle = document.getElementById("popup-title");
const popupAuthor = document.getElementById("popup-author");
const popupDescription = document.getElementById("popup-description");
const popupFormats = document.getElementById("popup-formats");
const popupPrice = document.getElementById("popup-price");
const popupBuyNow = document.getElementById("popup-buy-now");
const closePopup = document.querySelector(".close-popup");

// Assicurarsi che gli elementi richiesti esistano
if (!libriDiv) {
    console.error("Errore: elemento 'libri' non trovato in index.html.");
}
if (!popupContainer) {
    console.error("Errore: elemento 'book-popup' non trovato in index.html.");
}
if (!popupImage) {
    console.error("Errore: elemento 'popup-image' non trovato in index.html.");
}
if (!popupTitle) {
    console.error("Errore: elemento 'popup-title' non trovato in index.html.");
}
if (!popupAuthor) {
    console.error("Errore: elemento 'popup-author' non trovato in index.html.");
}
if (!popupDescription) {
    console.error("Errore: elemento 'popup-description' non trovato in index.html.");
}
if (!popupFormats) {
    console.error("Errore: elemento 'popup-formats' non trovato in index.html.");
}
if (!popupPrice) {
    console.error("Errore: elemento 'popup-price' non trovato in index.html.");
}
if (!popupBuyNow) {
    console.error("Errore: elemento 'popup-buy-now' non trovato in index.html.");
}
if (!closePopup) {
    console.error("Errore: elemento 'close-popup' non trovato in index.html.");
}

// Funzione per mostrare i libri nel catalogo
function mostraLibri() {
    const libriRef = firebase.database().ref("libri");
    libriRef.once("value").then(snapshot => {
        const libri = snapshot.val();
        libriDiv.innerHTML = ""; // Pulisce il contenitore prima di aggiornarlo

        if (libri) {
            Object.entries(libri).forEach(([id, libro]) => {
                // Crea la card del libro
                const libroDiv = document.createElement("div");
                libroDiv.classList.add("section-libro");

                const immagine = document.createElement("img");
                immagine.src = libro.immagine || "placeholder.jpg";
                immagine.alt = libro.titolo;
                immagine.classList.add("img-libro");

                const titolo = document.createElement("h3");
                titolo.textContent = libro.titolo || "Titolo non disponibile";

                const autore = document.createElement("p");
                autore.textContent = libro.autore ? "di " + libro.autore : "Autore sconosciuto";

                const prezzo = document.createElement("p");
                prezzo.innerHTML = libro.valuta && libro.prezzo ? `<b>da ${libro.valuta}${libro.prezzo}</b>` : "Prezzo non disponibile";

                const buyButton = document.createElement("button");
                buyButton.classList.add("buy-now-button");
                buyButton.textContent = "Acquista ora";
                if (libro.linkAmazon) {
                    buyButton.addEventListener("click", () => {
                        window.open(libro.linkAmazon, "_blank");
                    });
                } else {
                    buyButton.disabled = true;
                }

                // Aggiunge gli elementi alla card del libro
                libroDiv.appendChild(immagine);
                libroDiv.appendChild(titolo);
                libroDiv.appendChild(autore);
                libroDiv.appendChild(prezzo);
                libroDiv.appendChild(buyButton);

                // Aggiunge evento per aprire il popup
                libroDiv.addEventListener("click", () => mostraInfoLibro(id));

                // Aggiunge il libro al catalogo
                libriDiv.appendChild(libroDiv);
            });
        } else {
            libriDiv.innerHTML = "<p>Nessun libro disponibile.</p>";
        }
    }).catch(error => {
        console.error("Errore nel recupero dei libri:", error);
    });
}

// Funzione per mostrare le informazioni del libro nel popup
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;

        // Aggiorna il contenuto del popup
        popupImage.src = libro.immagine || "placeholder.jpg";
        popupImage.alt = libro.titolo;
        popupTitle.textContent = libro.titolo || "Titolo non disponibile";
        popupAuthor.textContent = libro.autore ? "di " + libro.autore : "Autore sconosciuto";
        popupDescription.textContent = libro.descrizione || "Nessuna descrizione disponibile.";

        // Mostra i formati disponibili
        if (libro.formati && Array.isArray(libro.formati) && libro.formati.length > 0) {
            popupFormats.textContent = "Formati disponibili: " + libro.formati.join(", ");
        } else {
            popupFormats.textContent = "Nessun formato disponibile";
        }

        popupPrice.innerHTML = libro.valuta && libro.prezzo ? `<b>da ${libro.valuta}${libro.prezzo}</b>` : "Prezzo non disponibile";

        if (libro.linkAmazon) {
            popupBuyNow.style.display = "block";
            popupBuyNow.onclick = () => window.open(libro.linkAmazon, "_blank");
        } else {
            popupBuyNow.style.display = "none";
        }

        // Mostra il popup
        popupContainer.style.display = "flex";
    }).catch(error => {
        console.error("Errore nel recupero dei dettagli del libro:", error);
    });
}

// Chiude il popup
closePopup.addEventListener("click", () => {
    popupContainer.style.display = "none";
});

// Funzione per mostrare il logo
function mostraLogo() {
    const logo = localStorage.getItem("logo");
    if (logo) {
        document.getElementById("logo-catalogo").src = logo;
    }
}

// Funzione per mostrare il banner
function mostraBanner() {
    const banner = localStorage.getItem("banner");
    if (banner) {
        document.getElementById("banner-catalogo").src = banner;
    }
}

// Inizializza il contenuto
mostraLibri();
mostraLogo();
mostraBanner();