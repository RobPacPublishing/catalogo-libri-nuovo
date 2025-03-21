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
const popupPrice = document.getElementById("popup-price");
const popupBuyNow = document.getElementById("popup-buy-now");
const closePopupButton = document.querySelector(".close-popup");

// Traduzione in inglese per il catalogo libri
const TEXTS = {
    buyNow: "Buy Now",
    author: "by",
    priceFrom: "from "
};

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
                    buyButton.addEventListener("click", (event) => {
                        event.stopPropagation();
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
        popupDescription.textContent = libro.descrizione && libro.descrizione.trim() !== "" ? libro.descrizione : "No description available.";

        if (libro.valuta && libro.prezzo) {
            popupPrice.innerHTML = `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>`;
        } else {
            popupPrice.innerHTML = "";
        }

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
function closePopup() {
    popupContainer.style.display = "none";
}

if (closePopupButton) {
    closePopupButton.addEventListener("click", closePopup);
}

// Funzione per mostrare il logo
function mostraLogo() {
    const logoContainer = document.getElementById("logo-container");
    if (logoContainer) {
        logoContainer.style.display = "block";
    } else {
        console.error("Errore: elemento 'logo-container' non trovato.");
    }
}

// Funzione per mostrare il banner
function mostraBanner() {
    const banner = document.getElementById("banner-catalogo");
    if (banner) {
        banner.style.display = "block";
    } else {
        console.error("Errore: elemento 'banner-catalogo' non trovato.");
    }
}

// Funzione di controllo duplicati (basato su link Amazon)
async function libroEsiste(linkAmazon) {
    const snapshot = await firebase.database().ref("libri").orderByChild("linkAmazon").equalTo(linkAmazon).once("value");
    return snapshot.exists();
}

// Sovrascrittura evento form per bloccare i duplicati
const form = document.getElementById("libro-form");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const linkAmazon = document.getElementById("linkAmazon").value.trim();
        if (!linkAmazon) {
            alert("⚠️ Inserisci il link Amazon.");
            return;
        }

        const esiste = await libroEsiste(linkAmazon);
        if (esiste) {
            alert("❌ Libro già presente nel catalogo (link Amazon duplicato).");
            return;
        }

        // Procedi con la logica originale del submit (eventuale altro script)
        form.submit();
    });
}

// Avvia il caricamento dei libri e logo/banner
mostraLibri();
mostraLogo();
mostraBanner();


