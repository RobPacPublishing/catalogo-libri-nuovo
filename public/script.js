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

// Allineamento contenuti delle miniature libri
libriDiv.style.display = "grid";
libriDiv.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
libriDiv.style.gap = "20px";
libriDiv.style.textAlign = "center";

// Traduzione in inglese per il catalogo libri
const TEXTS = {
    buyNow: "Buy Now",
    author: "by",
    priceFrom: "from "
};

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
        libriDiv.innerHTML = "";

        if (libri) {
            Object.entries(libri).forEach(([id, libro]) => {
                const libroDiv = document.createElement("div");
                libroDiv.classList.add("section-libro");

                const immagine = document.createElement("img");
                immagine.src = libro.immagine || "placeholder.jpg";
                immagine.alt = libro.titolo;
                immagine.classList.add("img-libro");

                const titolo = document.createElement("h3");
                titolo.textContent = libro.titolo || "Title not available";

                const autore = document.createElement("p");
                autore.textContent = libro.autore ? `${TEXTS.author} ${libro.autore}` : "Unknown author";

                const prezzo = document.createElement("p");
                prezzo.innerHTML = libro.valuta && libro.prezzo ? `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>` : "Price not available";

                const buyButton = document.createElement("button");
                buyButton.classList.add("buy-now-button");
                buyButton.textContent = TEXTS.buyNow;
                if (libro.linkAmazon) {
                    buyButton.addEventListener("click", () => {
                        window.open(libro.linkAmazon, "_blank");
                    });
                } else {
                    buyButton.disabled = true;
                }

                libroDiv.appendChild(immagine);
                libroDiv.appendChild(titolo);
                libroDiv.appendChild(autore);
                libroDiv.appendChild(prezzo);
                libroDiv.appendChild(buyButton);
                libroDiv.addEventListener("click", () => mostraInfoLibro(id));
                libriDiv.appendChild(libroDiv);
            });
        } else {
            libriDiv.innerHTML = "<p>No books available.</p>";
        }
    }).catch(error => {
        console.error("Error retrieving books:", error);
    });
}

// Funzione per mostrare le informazioni del libro nel popup
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;

        popupImage.src = libro.immagine || "placeholder.jpg";
        popupImage.alt = libro.titolo;
        popupTitle.textContent = libro.titolo || "Title not available";
        popupAuthor.textContent = libro.autore ? `${TEXTS.author} ${libro.autore}` : "Unknown author";
        popupDescription.textContent = libro.descrizione || "No description available.";

        popupFormats.textContent = libro.formati && Array.isArray(libro.formati) && libro.formati.length > 0
            ? "Available formats: " + libro.formati.join(", ")
            : "No formats available";

        popupPrice.innerHTML = libro.valuta && libro.prezzo ? `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>` : "Price not available";

        if (libro.linkAmazon) {
            popupBuyNow.style.display = "block";
            popupBuyNow.onclick = () => window.open(libro.linkAmazon, "_blank");
        } else {
            popupBuyNow.style.display = "none";
        }

        popupContainer.style.display = "flex";
    }).catch(error => {
        console.error("Error retrieving book details:", error);
    });
}

// Chiude il popup
closePopup.addEventListener("click", () => {
    popupContainer.style.display = "none";
});

// Inizializza il contenuto
mostraLibri();
mostraLogo();
mostraBanner();