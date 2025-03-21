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
const popupGenre = document.getElementById("popup-genre");
const popupSottogenere = document.getElementById("popup-sottogenere");
const popupBuyNow = document.getElementById("popup-buy-now");
const closePopupButton = document.querySelector(".close-popup");
const filtroTesto = document.getElementById("filtro-testo");
const filtroGenere = document.getElementById("filtro-genere");
const filtroSottogenere = document.getElementById("filtro-sottogenere");

// Traduzione in inglese per il catalogo libri
const TEXTS = {
    buyNow: "Buy Now",
    author: "by",
    priceFrom: "from ",
    genre: "Genre: ",
    subgenre: "Subgenre: ",
    filterAll: "All Genres",
    filterAllSub: "All Subgenres",
    noBooks: "No books available matching your criteria."
};

// Array per memorizzare tutti i libri
let tuttiLibri = [];
let generiDisponibili = [];
let sottogeneriDisponibili = [];

// Carica generi disponibili
function caricaGeneri() {
    firebase.database().ref('generi').once("value").then(snapshot => {
        generiDisponibili = snapshot.val() || [];
        aggiornaFiltroGeneri();
    }).catch(error => {
        console.error("Errore caricamento generi:", error);
    });
    
    firebase.database().ref('sottogeneri').once("value").then(snapshot => {
        sottogeneriDisponibili = snapshot.val() || [];
        aggiornaFiltroSottogeneri();
    }).catch(error => {
        console.error("Errore caricamento sottogeneri:", error);
    });
}

// Aggiorna la select dei generi
function aggiornaFiltroGeneri() {
    if (!filtroGenere) return;
    
    // Opzione per tutti i generi
    filtroGenere.innerHTML = `<option value="">${TEXTS.filterAll}</option>`;
    
    // Aggiungi i generi
    generiDisponibili.forEach(genere => {
        const option = document.createElement('option');
        option.value = genere;
        option.textContent = genere;
        filtroGenere.appendChild(option);
    });
    
    // Event listener per filtro genere
    filtroGenere.addEventListener("change", filtraLibri);
}

// Aggiorna la select dei sottogeneri
function aggiornaFiltroSottogeneri() {
    if (!filtroSottogenere) return;
    
    // Opzione per tutti i sottogeneri
    filtroSottogenere.innerHTML = `<option value="">${TEXTS.filterAllSub}</option>`;
    
    // Aggiungi i sottogeneri
    sottogeneriDisponibili.forEach(sottogenere => {
        const option = document.createElement('option');
        option.value = sottogenere;
        option.textContent = sottogenere;
        filtroSottogenere.appendChild(option);
    });
    
    // Event listener per filtro sottogenere
    filtroSottogenere.addEventListener("change", filtraLibri);
}

// Carica e mostra i libri
function caricaLibri() {
    const libriRef = firebase.database().ref("libri");
    
    libriRef.once("value").then(snapshot => {
        const libri = snapshot.val();
        
        if (libri) {
            tuttiLibri = Object.entries(libri).map(([id, libro]) => ({
                id,
                ...libro
            }));
            
            // Estrai tutti i generi non vuoti dai libri
            const generiDaiLibri = [...new Set(tuttiLibri
                .filter(libro => libro.genere && libro.genere.trim() !== "")
                .map(libro => libro.genere))];
            
            // Aggiungi eventuali generi mancanti all'array generiDisponibili
            generiDaiLibri.forEach(genere => {
                if (!generiDisponibili.includes(genere)) {
                    generiDisponibili.push(genere);
                }
            });
            
            // Estrai tutti i sottogeneri non vuoti dai libri
            const sottogeneriDaiLibri = [...new Set(tuttiLibri
                .filter(libro => libro.sottogenere && libro.sottogenere.trim() !== "")
                .map(libro => libro.sottogenere))];
            
            // Aggiungi eventuali sottogeneri mancanti all'array sottogeneriDisponibili
            sottogeneriDaiLibri.forEach(sottogenere => {
                if (!sottogeneriDisponibili.includes(sottogenere)) {
                    sottogeneriDisponibili.push(sottogenere);
                }
            });
            
            // Aggiorna il filtro generi e mostra i libri
            aggiornaFiltroGeneri();
            aggiornaFiltroSottogeneri();
            filtraLibri();
        } else {
            libriDiv.innerHTML = `<p>${TEXTS.noBooks}</p>`;
        }
    }).catch(error => {
        console.error("Error retrieving books:", error);
    });
}

// Filtra i libri in base a testo, genere e sottogenere
function filtraLibri() {
    if (!libriDiv) return;
    
    const testoFiltro = filtroTesto ? filtroTesto.value.toLowerCase() : "";
    const genereFiltro = filtroGenere ? filtroGenere.value : "";
    const sottogenereFiltro = filtroSottogenere ? filtroSottogenere.value : "";
    
    // Applica filtri
    const libriFiltrati = tuttiLibri.filter(libro => {
        // Filtro per testo
        const matchTesto = !testoFiltro || 
            (libro.titolo && libro.titolo.toLowerCase().includes(testoFiltro)) || 
            (libro.autore && libro.autore.toLowerCase().includes(testoFiltro));
        
        // Filtro per genere
        const matchGenere = !genereFiltro || 
            (libro.genere && libro.genere === genereFiltro);
        
        // Filtro per sottogenere
        const matchSottogenere = !sottogenereFiltro || 
            (libro.sottogenere && libro.sottogenere === sottogenereFiltro);
        
        return matchTesto && matchGenere && matchSottogenere;
    });
    
    mostraLibri(libriFiltrati);
}

// Funzione per mostrare i libri nel catalogo
function mostraLibri(libri) {
    libriDiv.innerHTML = "";
    
    if (!libri || libri.length === 0) {
        libriDiv.innerHTML = `<p>${TEXTS.noBooks}</p>`;
        return;
    }
    
    libri.forEach(libro => {
        const libroDiv = document.createElement("div");
        libroDiv.classList.add("section-libro");
        
        // Struttura in due parti: superiore (immagine e titolo) e inferiore (resto)
        libroDiv.innerHTML = `
            <div class="libro-top">
                <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" class="img-libro">
                <h3>${libro.titolo || "Title not available"}</h3>
            </div>
            <div class="libro-bottom">
                <p>${libro.autore ? `${TEXTS.author} ${libro.autore}` : "Unknown author"}</p>
                ${libro.genere ? `<p class="libro-genere">${TEXTS.genre}${libro.genere}</p>` : ""}
                ${libro.sottogenere ? `<p class="libro-sottogenere">${TEXTS.subgenre}${libro.sottogenere}</p>` : ""}
                <p><b>${libro.valuta && libro.prezzo ? `${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}` : "Price not available"}</b></p>
                <button class="buy-now-button">${TEXTS.buyNow}</button>
            </div>
        `;
        
        // Aggiungi event listener al pulsante di acquisto
        const buyButton = libroDiv.querySelector(".buy-now-button");
        if (libro.linkAmazon) {
            buyButton.addEventListener("click", (event) => {
                event.stopPropagation();
                window.open(libro.linkAmazon, "_blank");
            });
        } else {
            buyButton.disabled = true;
        }
        
        // Event listener per aprire il popup con i dettagli del libro
        libroDiv.addEventListener("click", () => mostraInfoLibro(libro.id));
        
        libriDiv.appendChild(libroDiv);
    });
}

// Funzione per mostrare le informazioni del libro nel popup
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;
        
        // Imposta l'immagine
        popupImage.src = libro.immagine || "placeholder.jpg";
        popupImage.alt = libro.titolo;
        
        // Imposta il titolo
        popupTitle.textContent = libro.titolo || "Title not available";
        
        // Imposta l'autore
        popupAuthor.textContent = libro.autore ? `${TEXTS.author} ${libro.autore}` : "Unknown author";
        
        // Imposta la descrizione
        popupDescription.textContent = libro.descrizione && libro.descrizione.trim() !== "" 
            ? libro.descrizione 
            : "No description available.";
        
        // Imposta il genere
        if (popupGenre) {
            if (libro.genere && libro.genere.trim() !== "") {
                popupGenre.textContent = `${TEXTS.genre}${libro.genere}`;
                popupGenre.style.display = "inline-block";
            } else {
                popupGenre.style.display = "none";
            }
        }
        
        // Imposta il sottogenere
        if (popupSottogenere) {
            if (libro.sottogenere && libro.sottogenere.trim() !== "") {
                popupSottogenere.textContent = `${TEXTS.subgenre}${libro.sottogenere}`;
                popupSottogenere.style.display = "inline-block";
            } else {
                popupSottogenere.style.display = "none";
            }
        }
        
        // Imposta il prezzo
        if (libro.valuta && libro.prezzo) {
            popupPrice.innerHTML = `<b>${TEXTS.priceFrom}${libro.valuta}${libro.prezzo}</b>`;
        } else {
            popupPrice.innerHTML = "";
        }
        
        // Gestisce il pulsante di acquisto
        if (libro.linkAmazon) {
            popupBuyNow.style.display = "block";
            popupBuyNow.onclick = () => window.open(libro.linkAmazon, "_blank");
        } else {
            popupBuyNow.style.display = "none";
        }
        
        // Mostra il popup
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

// Chiudi il popup se si clicca fuori
popupContainer.addEventListener("click", function(event) {
    if (event.target === popupContainer) {
        closePopup();
    }
});

// Event listener per il filtro testo
if (filtroTesto) {
    filtroTesto.addEventListener("input", filtraLibri);
}

// Avvia il caricamento di generi e libri
caricaGeneri();
caricaLibri();