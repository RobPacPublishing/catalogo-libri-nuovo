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

                libroDiv.innerHTML = `
                    <div class="libro-top">
                        <img class="img-libro" src="${libro.immagine || 'placeholder.jpg'}" alt="${libro.titolo}">
                        <h3>${libro.titolo || 'Title not available'}</h3>
                    </div>
                    <div class="libro-bottom">
                        <p>${libro.autore ? `${TEXTS.author} ${libro.autore}` : 'Unknown author'}</p>
                        <p>${libro.valuta && libro.prezzo ? `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>` : 'Price not available'}</p>
                        <button class="buy-now-button" ${libro.linkAmazon ? `onclick="window.open('${libro.linkAmazon}', '_blank')"` : 'disabled'}>${TEXTS.buyNow}</button>
                    </div>
                `;

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

        popupContainer.innerHTML = `
            <div class="popup-content">
                <span class="close-popup">&times;</span>
                <img id="popup-image" src="${libro.immagine || 'placeholder.jpg'}" alt="Book Cover">
                <div class="popup-text">
                    <h3 id="popup-title">${libro.titolo || 'Title not available'}</h3>
                    <p id="popup-author">${libro.autore ? `${TEXTS.author} ${libro.autore}` : 'Unknown author'}</p>
                    <p id="popup-description">${libro.descrizione || 'No description available.'}</p>
                    <p id="popup-price">${libro.valuta && libro.prezzo ? `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>` : ''}</p>
                    <button id="popup-buy-now" class="buy-now-button" ${libro.linkAmazon ? `onclick="window.open('${libro.linkAmazon}', '_blank')"` : 'disabled'}>${TEXTS.buyNow}</button>
                </div>
            </div>
        `;
        popupContainer.style.display = "flex";

        // Chiudi il popup cliccando sulla X
        document.querySelector(".close-popup").addEventListener("click", () => {
            popupContainer.style.display = "none";
        });
    }).catch(error => {
        console.error("Error retrieving book details:", error);
    });
}

// Avvia il caricamento dei libri
mostraLibri();
mostraLogo();
mostraBanner();