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

// Categorie e sottocategorie predefinite
const CATEGORIES = {
    "Fiction & Literature": [
        "Literature & Fiction", 
        "Mystery, Thriller & Suspense", 
        "Romance", 
        "Science Fiction & Fantasy", 
        "Comics & Graphic Novels", 
        "Humor & Entertainment", 
        "Teen & Young Adult", 
        "Children's Books"
    ],
    "Sciences & Knowledge": [
        "Science & Math", 
        "Computers & Technology", 
        "Engineering & Transportation", 
        "Medical Books", 
        "Education & Teaching", 
        "Reference"
    ],
    "Society & Culture": [
        "History", 
        "Politics & Social Sciences", 
        "Biographies & Memoirs", 
        "Religion & Spirituality", 
        "Law", 
        "LGBTQ+ Books"
    ],
    "Personal Growth & Wellbeing": [
        "Health, Fitness & Dieting", 
        "Self-Help", 
        "Business & Money", 
        "Parenting & Relationships"
    ],
    "Lifestyle & Hobbies": [
        "Arts & Photography", 
        "Cookbooks, Food & Wine", 
        "Crafts, Hobbies & Home", 
        "Sports & Outdoors", 
        "Travel", 
        "Calendars", 
        "Test Preparation"
    ],
    "In lingua italiana": [
        "Narrativa e Letteratura", 
        "Scienze e Conoscenza", 
        "Società e Cultura", 
        "Crescita Personale e Benessere", 
        "Stile di Vita e Hobby"
    ]
};

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

// Elementi della navbar e filtri
const categoryLinks = document.querySelectorAll('.main-categories a[data-category]');
const subcategoryLinks = document.querySelectorAll('.dropdown-content a[data-subcategory]');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainCategories = document.querySelector('.main-categories');
let currentCategory = '';
let currentSubcategory = '';

// Traduzione in inglese per il catalogo libri
const TEXTS = {
    buyNow: "Buy Now",
    author: "by",
    priceFrom: "from ",
    genre: "Genre: ",
    subgenre: "Subgenre: ",
    filterAll: "All Categories",
    filterAllSub: "All Subcategories",
    noBooks: "No books available matching your criteria."
};

// Array per memorizzare tutti i libri
let tuttiLibri = [];
let generiDisponibili = [];
let sottogeneriDisponibili = [];

// Funzione per inizializzare la navigazione
function initCategoryNavigation() {
    // Gestisci clic su categoria principale
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            // Aggiorna la selezione attiva
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Aggiorna il filtro categoria
            if (filtroGenere) {
                filtroGenere.value = category;
                // Evento per triggerare il filtro
                filtroGenere.dispatchEvent(new Event('change'));
            }
            
            // In modalità mobile, apri/chiudi il dropdown
            if (window.innerWidth <= 768) {
                const parentLi = this.parentElement;
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    if (dropdown !== parentLi) dropdown.classList.remove('open');
                });
                parentLi.classList.toggle('open');
            }
            
            currentCategory = category;
            currentSubcategory = '';
            filtraLibri();
        });
    });
    
    // Gestisci clic su sottocategoria
    subcategoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const subcategory = this.getAttribute('data-subcategory');
            const category = this.closest('.dropdown').querySelector('a[data-category]').getAttribute('data-category');
            
            // Aggiorna la selezione attiva
            subcategoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Aggiorna i filtri
            if (filtroGenere) filtroGenere.value = category;
            if (filtroSottogenere) {
                filtroSottogenere.value = subcategory;
                // Evento per triggerare il filtro
                filtroSottogenere.dispatchEvent(new Event('change'));
            }
            
            currentCategory = category;
            currentSubcategory = subcategory;
            filtraLibri();
        });
    });
    
    // Gestione responsive per mobile
    if (window.innerWidth <= 768) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('open');
            });
        });
    }
}

// Gestione del menu hamburger per mobile
if (mobileMenuToggle && mainCategories) {
    mobileMenuToggle.addEventListener('click', function() {
        mainCategories.classList.toggle('show');
    });
}

// Chiudi menu hamburger quando si clicca fuori
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const isClickInsideNav = event.target.closest('.categories-nav');
        
        if (!isClickInsideNav && mainCategories && mainCategories.classList.contains('show')) {
            mainCategories.classList.remove('show');
        }
    }
});

// Chiudi sottomenu quando si clicca su un sottogenere
subcategoryLinks.forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 768 && mainCategories) {
            mainCategories.classList.remove('show');
        }
    });
});

// Carica generi disponibili
function caricaGeneri() {
    // Prima carichiamo le categorie predefinite
    generiDisponibili = Object.keys(CATEGORIES);
    
    // Poi le sottocategorie
    sottogeneriDisponibili = [];
    Object.values(CATEGORIES).forEach(subcategories => {
        subcategories.forEach(subcat => {
            if (!sottogeneriDisponibili.includes(subcat)) {
                sottogeneriDisponibili.push(subcat);
            }
        });
    });
    
    // Aggiorniamo anche dal database per eventuali generi personalizzati
    firebase.database().ref('generi').once("value").then(snapshot => {
        const dbGeneri = snapshot.val() || [];
        dbGeneri.forEach(genere => {
            if (!generiDisponibili.includes(genere)) {
                generiDisponibili.push(genere);
            }
        });
        aggiornaFiltroGeneri();
    }).catch(error => {
        console.error("Errore caricamento generi:", error);
    });
    
    firebase.database().ref('sottogeneri').once("value").then(snapshot => {
        const dbSottogeneri = snapshot.val() || [];
        dbSottogeneri.forEach(sottogenere => {
            if (!sottogeneriDisponibili.includes(sottogenere)) {
                sottogeneriDisponibili.push(sottogenere);
            }
        });
        aggiornaFiltroSottogeneri();
    }).catch(error => {
        console.error("Errore caricamento sottogeneri:", error);
    });
    
    // Dopo aver caricato le categorie, inizializza la navigazione
    initCategoryNavigation();
}

// Aggiorna la select dei generi
function aggiornaFiltroGeneri() {
    if (!filtroGenere) return;
    
    // Opzione per tutti i generi
    filtroGenere.innerHTML = `<option value="">${TEXTS.filterAll}</option>`;
    
    // Aggiungi le categorie principali
    Object.keys(CATEGORIES).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filtroGenere.appendChild(option);
    });
    
    // Aggiungi eventuali generi personalizzati
    const customGeneri = generiDisponibili.filter(genere => !Object.keys(CATEGORIES).includes(genere));
    if (customGeneri.length > 0) {
        const group = document.createElement('optgroup');
        group.label = "Generi personalizzati";
        
        customGeneri.forEach(genere => {
            const option = document.createElement('option');
            option.value = genere;
            option.textContent = genere;
            group.appendChild(option);
        });
        
        filtroGenere.appendChild(group);
    }
    
    // Event listener per filtro genere
    filtroGenere.addEventListener("change", function() {
        const selectedCategory = this.value;
        // Aggiorna il dropdown dei sottogeneri
        aggiornaSottogeneriPerCategoria(selectedCategory);
        // Filtra i libri
        filtraLibri();
    });
}

// Aggiorna il dropdown dei sottogeneri in base alla categoria selezionata
function aggiornaSottogeneriPerCategoria(category) {
    if (!filtroSottogenere) return;
    
    // Reset del dropdown
    filtroSottogenere.innerHTML = `<option value="">${TEXTS.filterAllSub}</option>`;
    
    if (category && CATEGORIES[category]) {
        // Sottogeneri per la categoria selezionata
        CATEGORIES[category].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            filtroSottogenere.appendChild(option);
        });
    } else {
        // Mostra tutti i sottogeneri raggruppati se non è selezionata una categoria specifica
        Object.entries(CATEGORIES).forEach(([cat, subcategories]) => {
            if (subcategories.length > 0) {
                const group = document.createElement('optgroup');
                group.label = cat;
                
                subcategories.forEach(subcat => {
                    const option = document.createElement('option');
                    option.value = subcat;
                    option.textContent = subcat;
                    group.appendChild(option);
                });
                
                filtroSottogenere.appendChild(group);
            }
        });
        
        // Aggiungi eventuali sottogeneri personalizzati
        const customSottogeneri = sottogeneriDisponibili.filter(sottogenere => {
            return !Object.values(CATEGORIES).some(subcategories => 
                subcategories.includes(sottogenere)
            );
        });
        
        if (customSottogeneri.length > 0) {
            const group = document.createElement('optgroup');
            group.label = "Sottogeneri personalizzati";
            
            customSottogeneri.forEach(sottogenere => {
                const option = document.createElement('option');
                option.value = sottogenere;
                option.textContent = sottogenere;
                group.appendChild(option);
            });
            
            filtroSottogenere.appendChild(group);
        }
    }
}

// Aggiorna la select dei sottogeneri
function aggiornaFiltroSottogeneri() {
    if (!filtroSottogenere) return;
    
    // All subcategories option
    filtroSottogenere.innerHTML = `<option value="">${TEXTS.filterAllSub}</option>`;
    
    // Aggiorna in base al genere selezionato se presente
    const selectedCategory = filtroGenere ? filtroGenere.value : "";
    if (selectedCategory && CATEGORIES[selectedCategory]) {
        CATEGORIES[selectedCategory].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            filtroSottogenere.appendChild(option);
        });
    } else {
        // Mostra tutti i sottogeneri
        aggiornaSottogeneriPerCategoria("");
    }
    
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
    const genereFiltro = currentCategory || (filtroGenere ? filtroGenere.value : "");
    const sottogenereFiltro = currentSubcategory || (filtroSottogenere ? filtroSottogenere.value : "");
    
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