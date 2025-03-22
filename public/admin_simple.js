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

// Inizializza Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
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

// Elementi DOM principali
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const libroForm = document.getElementById("libro-form");
const libriInseriti = document.getElementById("libri-inseriti");
const filtroTesto = document.getElementById("filtroTesto");
const ordinamento = document.getElementById("ordinamento");
const messaggioFeedback = document.getElementById("messaggio-feedback");
const genereSelect = document.getElementById("genere");
const nuovoGenereInput = document.getElementById("nuovo-genere");
const aggiungiGenereBtn = document.getElementById("aggiungi-genere");
const sottogenereSelect = document.getElementById("sottogenere");
const nuovoSottogenereInput = document.getElementById("nuovo-sottogenere");
const aggiungiSottogenereBtn = document.getElementById("aggiungi-sottogenere");

// Array dei generi e sottogeneri
let generi = [];
let sottogeneri = [];

// DISABILITA TEMPORANEAMENTE FORMATI DISPONIBILI
["ebook", "paperback", "hardcover"].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.disabled = true;
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) label.style.display = "none";
    }
});

// Variabili per gestire la modifica dei libri
let libroCorrente = null; // Per tenere traccia del libro che si sta modificando
const btnAnnullaModifica = document.createElement('button');
btnAnnullaModifica.textContent = "Annulla Modifica";
btnAnnullaModifica.style.display = "none";
btnAnnullaModifica.style.backgroundColor = "#999";
btnAnnullaModifica.style.marginTop = "10px";
if (libroForm) {
    libroForm.appendChild(btnAnnullaModifica);
}

// Crea modal per i dettagli del libro
const dettagliModal = document.createElement('div');
dettagliModal.className = 'modal';
dettagliModal.innerHTML = `
    <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="libro-dettagli">
            <img id="dettagli-immagine" src="" alt="Copertina libro">
            <div class="libro-dettagli-info">
                <h2 id="dettagli-titolo"></h2>
                <p id="dettagli-autore"></p>
                <div id="dettagli-genere-container">
                    <span id="dettagli-genere" class="libro-genere"></span>
                    <span id="dettagli-sottogenere" class="libro-sottogenere"></span>
                </div>
                <p id="dettagli-prezzo"></p>
                <p><a id="dettagli-link" href="#" target="_blank">Vedi su Amazon</a></p>
            </div>
        </div>
        <div class="libro-descrizione">
            <h3>Descrizione</h3>
            <p id="dettagli-descrizione"></p>
        </div>
    </div>
`;
document.body.appendChild(dettagliModal);

// Chiudi modal quando si clicca sulla X
const closeModal = dettagliModal.querySelector('.close-modal');
closeModal.addEventListener('click', () => {
    dettagliModal.style.display = 'none';
});

// Chiudi modal quando si clicca fuori dal contenuto
window.addEventListener('click', (event) => {
    if (event.target === dettagliModal) {
        dettagliModal.style.display = 'none';
    }
});

// Amministratori
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Cache libri
let cacheLibri = [];

// Notifiche
const notifica = document.createElement("div");
notifica.id = "notifica";
document.body.appendChild(notifica);

function mostraNotifica(testo, tipo = "successo") {
    notifica.textContent = testo;
    notifica.className = tipo === "errore" ? "notifica-errore" : "notifica-successo";
    notifica.style.display = "block";
    notifica.style.opacity = "1";
    
    setTimeout(() => {
        notifica.style.opacity = "0";
        setTimeout(() => { notifica.style.display = "none"; }, 500);
    }, 3000);
}

// Carica generi dal database
function caricaGeneri() {
    // Prima inizializziamo con le categorie predefinite
    generi = Object.keys(CATEGORIES);
    
    // Poi carichiamo eventuali generi personalizzati dal database
    firebase.database().ref('generi').once('value').then(snapshot => {
        if (snapshot.val()) {
            // Aggiungi solo i generi che non sono già nelle categorie predefinite
            snapshot.val().forEach(genere => {
                if (!generi.includes(genere)) {
                    generi.push(genere);
                }
            });
        }
        aggiornaSelectGeneri();
    }).catch(error => {
        console.error("Errore caricamento generi:", error);
    });
}

// Carica sottogeneri dal database
function caricaSottogeneri() {
    // Prima inizializziamo con le sottocategorie predefinite
    sottogeneri = [];
    Object.values(CATEGORIES).forEach(subcategories => {
        subcategories.forEach(subcat => {
            if (!sottogeneri.includes(subcat)) {
                sottogeneri.push(subcat);
            }
        });
    });
    
    // Poi carichiamo eventuali sottocategorie personalizzate dal database
    firebase.database().ref('sottogeneri').once('value').then(snapshot => {
        if (snapshot.val()) {
            // Aggiungi solo i sottogeneri che non sono già nelle sottocategorie predefinite
            snapshot.val().forEach(sottogenere => {
                if (!sottogeneri.includes(sottogenere)) {
                    sottogeneri.push(sottogenere);
                }
            });
        }
        aggiornaSelectSottogeneri();
    }).catch(error => {
        console.error("Errore caricamento sottogeneri:", error);
    });
}

// Aggiorna la select dei generi per includere le categorie predefinite
function aggiornaSelectGeneri() {
    if (!genereSelect) return;
    
    // Le categorie principali sono già incluse nell'HTML come opzioni statiche
    
    // Aggiungi generi personalizzati (se esistono)
    const customGeneri = generi.filter(genere => !Object.keys(CATEGORIES).includes(genere));
    if (customGeneri.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = "Generi personalizzati";
        
        customGeneri.forEach(genere => {
            const option = document.createElement('option');
            option.value = genere;
            option.textContent = genere;
            customGroup.appendChild(option);
        });
        
        genereSelect.appendChild(customGroup);
    }
    
    // Se è in modalità di modifica, seleziona il genere corrente
    if (libroCorrente && libroCorrente.genere) {
        genereSelect.value = libroCorrente.genere;
        
        // Aggiorna i sottogeneri basati sul genere selezionato
        if (CATEGORIES[libroCorrente.genere]) {
            const event = new Event('change');
            genereSelect.dispatchEvent(event);
        }
    }
}

// Aggiorna la select dei sottogeneri per gestire le sottocategorie in base al genere
function aggiornaSelectSottogeneri() {
    if (!sottogenereSelect) return;
    
    // Se un genere principale è selezionato, i suoi sottogeneri saranno mostrati dall'event listener di change
    const selectedCategory = genereSelect ? genereSelect.value : "";
    
    if (selectedCategory && CATEGORIES[selectedCategory]) {
        return; // I sottogeneri sono già gestiti dall'event listener di change
    }
    
    // Aggiungi sottogeneri personalizzati (se esistono)
    const customSottogeneri = sottogeneri.filter(sottogenere => {
        // Verifica se il sottogenere non è in nessuna delle categorie predefinite
        return !Object.values(CATEGORIES).some(subcategories => 
            subcategories.includes(sottogenere)
        );
    });
    
    if (customSottogeneri.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = "Sottogeneri personalizzati";
        
        customSottogeneri.forEach(sottogenere => {
            const option = document.createElement('option');
            option.value = sottogenere;
            option.textContent = sottogenere;
            customGroup.appendChild(option);
        });
        
        sottogenereSelect.appendChild(customGroup);
    }
    
    // Se è in modalità di modifica, seleziona il sottogenere corrente
    if (libroCorrente && libroCorrente.sottogenere) {
        sottogenereSelect.value = libroCorrente.sottogenere;
    }
}

// Aggiorna il dropdown dei sottogeneri in base al genere selezionato
genereSelect.addEventListener('change', function() {
    const selectedCategory = this.value;
    
    // Aggiorna il dropdown dei sottogeneri in base alla categoria selezionata
    if (selectedCategory && CATEGORIES[selectedCategory]) {
        // Ha selezionato una categoria principale, mostra solo i sottogeneri relativi
        const subcategories = CATEGORIES[selectedCategory];
        
        // Resetta il dropdown
        sottogenereSelect.innerHTML = '<option value="">Seleziona sottogenere</option>';
        
        // Aggiungi i sottogeneri della categoria selezionata
        subcategories.forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            sottogenereSelect.appendChild(option);
        });
    } else {
        // Ha selezionato "Seleziona genere" o un genere personalizzato, mostra tutti i sottogeneri
        aggiornaSelectSottogeneri();
    }
});

// Aggiungi nuovo genere
function aggiungiGenere(nuovoGenere) {
    if (!nuovoGenere || nuovoGenere.trim() === "") return;
    
    nuovoGenere = nuovoGenere.trim();
    
    // Controlla se il genere esiste già
    if (generi.includes(nuovoGenere)) {
        mostraNotifica("Questo genere esiste già", "errore");
        return;
    }
    
    // Aggiungi il nuovo genere all'array
    generi.push(nuovoGenere);
    
    // Salva l'array aggiornato nel database
    firebase.database().ref('generi').set(generi)
        .then(() => {
            mostraNotifica(`Genere "${nuovoGenere}" aggiunto con successo`);
            aggiornaSelectGeneri();
            
            // Seleziona il nuovo genere
            if (genereSelect) {
                genereSelect.value = nuovoGenere;
            }
            
            // Pulisci il campo di input
            if (nuovoGenereInput) {
                nuovoGenereInput.value = "";
            }
        })
        .catch(error => {
            mostraNotifica("Errore durante l'aggiunta del genere", "errore");
            console.error("Errore aggiunta genere:", error);
        });
}

// Aggiungi nuovo sottogenere
function aggiungiSottogenere(nuovoSottogenere) {
    if (!nuovoSottogenere || nuovoSottogenere.trim() === "") return;
    
    nuovoSottogenere = nuovoSottogenere.trim();
    
    // Controlla se il sottogenere esiste già
    if (sottogeneri.includes(nuovoSottogenere)) {
        mostraNotifica("Questo sottogenere esiste già", "errore");
        return;
    }
    
    // Aggiungi il nuovo sottogenere all'array
    sottogeneri.push(nuovoSottogenere);
    
    // Salva l'array aggiornato nel database
    firebase.database().ref('sottogeneri').set(sottogeneri)
        .then(() => {
            mostraNotifica(`Sottogenere "${nuovoSottogenere}" aggiunto con successo`);
            aggiornaSelectSottogeneri();
            
            // Seleziona il nuovo sottogenere
            if (sottogenereSelect) {
                sottogenereSelect.value = nuovoSottogenere;
            }
            
            // Pulisci il campo di input
            if (nuovoSottogenereInput) {
                nuovoSottogenereInput.value = "";
            }
        })
        .catch(error => {
            mostraNotifica("Errore durante l'aggiunta del sottogenere", "errore");
            console.error("Errore aggiunta sottogenere:", error);
        });
}

// Event listener per il pulsante aggiungi genere
if (aggiungiGenereBtn && nuovoGenereInput) {
    aggiungiGenereBtn.addEventListener("click", () => {
        aggiungiGenere(nuovoGenereInput.value);
    });
    
    // Consenti anche di premere Invio nel campo di input
    nuovoGenereInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Previeni l'invio del form
            aggiungiGenere(nuovoGenereInput.value);
        }
    });
}

// Event listener per il pulsante aggiungi sottogenere
if (aggiungiSottogenereBtn && nuovoSottogenereInput) {
    aggiungiSottogenereBtn.addEventListener("click", () => {
        aggiungiSottogenere(nuovoSottogenereInput.value);
    });
    
    // Consenti anche di premere Invio nel campo di input
    nuovoSottogenereInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Previeni l'invio del form
            aggiungiSottogenere(nuovoSottogenereInput.value);
        }
    });
}

// Autenticazione
firebase.auth().onAuthStateChanged(user => {
    if (user && amministratoriAutorizzati.includes(user.email)) {
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
        caricaGeneri();
        caricaSottogeneri();
        caricaLibri();
    } else {
        loginContainer.style.display = "block";
        adminPanel.style.display = "none";
        firebase.auth().signOut();
    }
});

// Login
loginButton.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            alert(`Benvenuto ${result.user.displayName}!`);
            setTimeout(() => location.reload(), 1000);
        })
        .catch(error => alert("Errore di autenticazione: " + error.message));
});

// Logout
logoutButton.addEventListener("click", () => {
    firebase.auth().signOut()
        .then(() => {
            alert("Logout effettuato con successo!");
            location.reload();
        })
        .catch(error => alert("Errore nel logout"));
});

// Upload immagine su Cloudinary
async function uploadImmagine(file) {
    if (!file) {
        console.log("Nessun file da caricare");
        return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "robpac_upload");
    formData.append("folder", "copertine");
    
    try {
        mostraNotifica("Caricamento immagine in corso...");
        
        const response = await fetch("https://api.cloudinary.com/v1_1/robpac/image/upload", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            mostraNotifica("Errore nel caricamento dell'immagine", "errore");
            return null;
        }
        
        const data = await response.json();
        mostraNotifica("Immagine caricata con successo");
        return data.secure_url;
    } catch (error) {
        console.error("Errore upload:", error);
        mostraNotifica("Errore nel caricamento dell'immagine: " + error.message, "errore");
        return null;
    }
}

// Carica libri
function caricaLibri() {
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        mostraLibriInseriti();
    }).catch(error => alert("Errore nel caricamento dei libri: " + error.message));
}

// Funzione per mostrare i dettagli del libro
function mostraDettagliLibro(id) {
    const libro = cacheLibri.find(libro => libro.id === id);
    if (!libro) {
        mostraNotifica("Libro non trovato", "errore");
        return;
    }
    
    // Popola il modal con i dettagli del libro
    document.getElementById("dettagli-immagine").src = libro.immagine || "placeholder.jpg";
    document.getElementById("dettagli-titolo").textContent = libro.titolo || "Titolo non disponibile";
    document.getElementById("dettagli-autore").textContent = `Autore: ${libro.autore || "Non specificato"}`;
    document.getElementById("dettagli-prezzo").textContent = `Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}`;
    
    // Gestione genere e sottogenere
    const dettagliGenere = document.getElementById("dettagli-genere");
    const dettagliSottogenere = document.getElementById("dettagli-sottogenere");
    
    if (libro.genere && libro.genere.trim() !== "") {
        dettagliGenere.textContent = libro.genere;
        dettagliGenere.style.display = "inline-block";
    } else {
        dettagliGenere.style.display = "none";
    }
    
    if (libro.sottogenere && libro.sottogenere.trim() !== "") {
        dettagliSottogenere.textContent = libro.sottogenere;
        dettagliSottogenere.style.display = "inline-block";
    } else {
        dettagliSottogenere.style.display = "none";
    }
    
    document.getElementById("dettagli-descrizione").textContent = libro.descrizione || "Nessuna descrizione disponibile.";
    
    const linkAmazon = document.getElementById("dettagli-link");
    if (libro.linkAmazon) {
        linkAmazon.href = libro.linkAmazon;
        linkAmazon.style.display = "inline";
    } else {
        linkAmazon.style.display = "none";
    }
    
    // Mostra il modal
    dettagliModal.style.display = "block";
}

// Mostra libri
function mostraLibriInseriti() {
    if (!libriInseriti) return;
    
    libriInseriti.innerHTML = "";
    
    // Filtraggio se disponibile
    let libriFiltrati = [...cacheLibri];
    if (filtroTesto && filtroTesto.value) {
        const testoFiltro = filtroTesto.value.toLowerCase();
        libriFiltrati = libriFiltrati.filter(libro =>
            (libro.titolo && libro.titolo.toLowerCase().includes(testoFiltro)) ||
            (libro.autore && libro.autore.toLowerCase().includes(testoFiltro)) ||
            (libro.genere && libro.genere.toLowerCase().includes(testoFiltro)) ||
            (libro.sottogenere && libro.sottogenere.toLowerCase().includes(testoFiltro))
        );
    }
    
    // Ordinamento se disponibile
    if (ordinamento && ordinamento.value) {
        const criterio = ordinamento.value;
        libriFiltrati.sort((a, b) => {
            if (criterio === "prezzo") {
                return parseFloat(a.prezzo || 0) - parseFloat(b.prezzo || 0);
            }
            return (a[criterio] || "").localeCompare(b[criterio] || "");
        });
    }
    
    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        
        div.innerHTML = `
            <div>
                <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" style="width:100px; height:150px;">
                <h3>${libro.titolo || "Titolo"}</h3>
                <p>Autore: ${libro.autore || "Autore"}</p>
                <p>Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}</p>
                ${libro.genere ? `<p class="libro-genere">Genere: ${libro.genere}</p>` : ''}
                ${libro.sottogenere ? `<p class="libro-sottogenere">Sottogenere: ${libro.sottogenere}</p>` : ''}
            </div>
            <div class="admin-libro-buttons">
                <button class="btn-dettagli" data-id="${libro.id}">👁️ Dettagli</button>
                <button class="btn-modifica" data-id="${libro.id}">✏️ Modifica</button>
                <button class="btn-elimina" data-id="${libro.id}">❌ Elimina</button>
            </div>
        `;
        
        libriInseriti.appendChild(div);
    });
    
    // Event listener per eliminare
    document.querySelectorAll(".btn-elimina").forEach(button => {
        button.addEventListener("click", function() {
            const id = this.getAttribute("data-id");
            eliminaLibro(id);
        });
    });
    
    // Event listener per modificare
    document.querySelectorAll(".btn-modifica").forEach(button => {
        button.addEventListener("click", function() {
            const id = this.getAttribute("data-id");
            preparaModificaLibro(id);
        });
    });
    
    // Event listener per dettagli
    document.querySelectorAll(".btn-dettagli").forEach(button => {
        button.addEventListener("click", function() {
            const id = this.getAttribute("data-id");
            mostraDettagliLibro(id);
        });
    });
}

// Elimina libro
function eliminaLibro(id) {
    if (confirm("Sei sicuro di voler eliminare questo libro?")) {
        firebase.database().ref(`libri/${id}`).remove()
            .then(() => {
                cacheLibri = cacheLibri.filter(libro => libro.id !== id);
                mostraLibriInseriti();
                mostraNotifica("📚 Libro eliminato con successo!");
            })
            .catch(error => mostraNotifica("❌ Errore durante l'eliminazione", "errore"));
    }
}

// Funzione per preparare la modifica di un libro
function preparaModificaLibro(id) {
    // Trova il libro nella cache
    libroCorrente = cacheLibri.find(libro => libro.id === id);
    if (!libroCorrente) {
        mostraNotifica("Libro non trovato", "errore");
        return;
    }
    
    // Popola il form con i dati del libro
    document.getElementById("titolo").value = libroCorrente.titolo || "";
    document.getElementById("autore").value = libroCorrente.autore || "";
    document.getElementById("descrizione").value = libroCorrente.descrizione || "";
    document.getElementById("linkAmazon").value = libroCorrente.linkAmazon || "";
    document.getElementById("prezzo").value = libroCorrente.prezzo || "";
    document.getElementById("valuta").value = libroCorrente.valuta || "$";
    
    // Se c'è un campo genere, popolalo
    if (genereSelect && libroCorrente.genere) {
        // Se l'opzione esiste, selezionala
        const options = Array.from(genereSelect.options);
        const optionToSelect = options.find(option => option.value === libroCorrente.genere);
        if (optionToSelect) {
            genereSelect.value = libroCorrente.genere;
        } else if (libroCorrente.genere) {
            // Se l'opzione non esiste, aggiungila al database dei generi e poi selezionala
            aggiungiGenere(libroCorrente.genere);
        }
        
        // Simula un evento di cambio per aggiornare i sottogeneri
        genereSelect.dispatchEvent(new Event('change'));
    }
    
    // Se c'è un campo sottogenere, popolalo
    if (sottogenereSelect && libroCorrente.sottogenere) {
        // Se l'opzione esiste, selezionala
        const options = Array.from(sottogenereSelect.options);
        const optionToSelect = options.find(option => option.value === libroCorrente.sottogenere);
        if (optionToSelect) {
            sottogenereSelect.value = libroCorrente.sottogenere;
        } else if (libroCorrente.sottogenere) {
            // Se l'opzione non esiste, aggiungila al database dei sottogeneri e poi selezionala
            aggiungiSottogenere(libroCorrente.sottogenere);
        }
    }
    
    // Cambia il testo del pulsante del form
    const submitButton = libroForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Salva Modifiche";
    }
    
    // Mostra il pulsante Annulla
    btnAnnullaModifica.style.display = "block";
    
    // Scorri fino al form
    libroForm.scrollIntoView({ behavior: 'smooth' });
    
    mostraNotifica("Modifica libro in corso...");
}

// Funzione per annullare la modifica
function annullaModifica() {
    libroCorrente = null;
    libroForm.reset();
    
    // Ripristina il testo del pulsante
    const submitButton = libroForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Aggiungi libro";
    }
    
    // Nascondi il pulsante Annulla
    btnAnnullaModifica.style.display = "none";
    
    mostraNotifica("Modifica annullata");
}

// Event listener per annullare la modifica
btnAnnullaModifica.addEventListener("click", function(event) {
    event.preventDefault();
    annullaModifica();
});

// Gestione form
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const titolo = document.getElementById("titolo").value.trim();
        const autore = document.getElementById("autore").value.trim();
        const descrizione = document.getElementById("descrizione").value.trim();
        const linkAmazon = document.getElementById("linkAmazon").value.trim();
        const prezzo = parseFloat(document.getElementById("prezzo").value.replace(",", "."));
        const valuta = document.getElementById("valuta").value;
        const immagineFile = document.getElementById("immagine").files[0];
        
        // Controllo genere e sottogenere, se esistono (opzionali)
        const genere = genereSelect ? genereSelect.value : "";
        const sottogenere = sottogenereSelect ? sottogenereSelect.value : "";
        
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            alert("⚠️ Tutti i campi devono essere compilati!");
            return;
        }
        
        // Se libroCorrente esiste, stiamo modificando, altrimenti stiamo aggiungendo
        if (libroCorrente) {
            // MODIFICA LIBRO ESISTENTE
            let urlImmagine = libroCorrente.immagine;
            
            // Se è stata fornita una nuova immagine, caricala
            if (immagineFile) {
                const nuovaUrlImmagine = await uploadImmagine(immagineFile);
                if (nuovaUrlImmagine) {
                    urlImmagine = nuovaUrlImmagine;
                }
            }
            
            const libro = {
                ...libroCorrente,
                titolo,
                autore,
                descrizione,
                linkAmazon,
                prezzo: prezzo.toFixed(2),
                valuta,
                immagine: urlImmagine,
                genere: genere || "",
                sottogenere: sottogenere || ""
            };
            
            firebase.database().ref(`libri/${libroCorrente.id}`).update(libro)
                .then(() => {
                    // Aggiorna nella cache
                    const index = cacheLibri.findIndex(l => l.id === libroCorrente.id);
                    if (index !== -1) {
                        cacheLibri[index] = libro;
                    }
                    
                    mostraLibriInseriti();
                    mostraNotifica("📚 Libro aggiornato con successo!");
                    
                    // Reset del form e dello stato di modifica
                    libroCorrente = null;
                    libroForm.reset();
                    
                    // Ripristina il testo del pulsante
                    const submitButton = libroForm.querySelector("button[type='submit']");
                    if (submitButton) {
                        submitButton.textContent = "Aggiungi libro";
                    }
                    
                    // Nascondi il pulsante Annulla
                    btnAnnullaModifica.style.display = "none";
                })
                .catch(error => {
                    mostraNotifica("❌ Errore durante l'aggiornamento del libro: " + error.message, "errore");
                });
        } else {
            // AGGIUNGI NUOVO LIBRO
            let urlImmagine = "placeholder.jpg";
            
            // Se è stata fornita un'immagine, caricala
            if (immagineFile) {
                const nuovaUrlImmagine = await uploadImmagine(immagineFile);
                if (nuovaUrlImmagine) {
                    urlImmagine = nuovaUrlImmagine;
                }
            }
            
            const libro = {
                titolo,
                autore,
                descrizione,
                linkAmazon,
                prezzo: prezzo.toFixed(2),
                valuta,
                immagine: urlImmagine,
                genere: genere || "",
                sottogenere: sottogenere || ""
            };
            
            const libriRef = firebase.database().ref('libri').push();
            libro.id = libriRef.key;
            
            libriRef.set(libro).then(() => {
                cacheLibri.push(libro);
                mostraLibriInseriti();
                mostraNotifica("📚 Libro aggiunto con successo!");
                libroForm.reset();
                
                // Se è stato specificato un genere e non è già presente nell'elenco, aggiungilo
                if (genere && !generi.includes(genere)) {
                    aggiungiGenere(genere);
                }
                
                // Se è stato specificato un sottogenere e non è già presente nell'elenco, aggiungilo
                if (sottogenere && !sottogeneri.includes(sottogenere)) {
                    aggiungiSottogenere(sottogenere);
                }
            }).catch(error => {
                mostraNotifica("❌ Errore durante l'aggiunta del libro: " + error.message, "errore");
            });
        }
    });
}

// Event listener per filtro e ordinamento se presenti
if (filtroTesto) {
    filtroTesto.addEventListener("input", mostraLibriInseriti);
}

if (ordinamento) {
    ordinamento.addEventListener("change", mostraLibriInseriti);
}

// Backup e Ripristino
const esportaDatiButton = document.getElementById("esporta-dati");
const importaDatiInput = document.getElementById("importa-dati");
const caricaDatiButton = document.getElementById("carica-dati");

if (esportaDatiButton) {
    esportaDatiButton.addEventListener("click", () => {
        const dataStr = JSON.stringify(cacheLibri);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = "libri_backup_" + new Date().toISOString().slice(0, 10) + ".json";
        
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
        
        mostraNotifica("📥 Dati esportati con successo!");
    });
}

if (caricaDatiButton && importaDatiInput) {
    caricaDatiButton.addEventListener("click", () => {
        const file = importaDatiInput.files[0];
        if (!file) {
            mostraNotifica("Seleziona un file JSON da importare", "errore");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    throw new Error("Formato file non valido");
                }
                
                if (confirm("⚠️ Questa operazione sovrascriverà tutti i libri esistenti. Continuare?")) {
                    const dbRef = firebase.database().ref("libri");
                    
                    // Elimina tutti i libri esistenti e inserisci quelli nuovi
                    dbRef.remove().then(() => {
                        const updates = {};
                        data.forEach(libro => {
                            const id = libro.id || dbRef.push().key;
                            updates[id] = { ...libro, id };
                            
                            // Aggiungi il genere se non esiste già
                            if (libro.genere && !generi.includes(libro.genere)) {
                                generi.push(libro.genere);
                                firebase.database().ref('generi').set(generi);
                            }
                            
                            // Aggiungi il sottogenere se non esiste già
                            if (libro.sottogenere && !sottogeneri.includes(libro.sottogenere)) {
                                sottogeneri.push(libro.sottogenere);
                                firebase.database().ref('sottogeneri').set(sottogeneri);
                            }
                        });
                        
                        dbRef.update(updates).then(() => {
                            mostraNotifica("📤 Dati importati con successo!");
                            caricaLibri();
                            aggiornaSelectGeneri();
                            aggiornaSelectSottogeneri();
                        }).catch(error => {
                            mostraNotifica("Errore durante l'importazione: " + error.message, "errore");
                        });
                    });
                }
            } catch (error) {
                mostraNotifica("Errore durante la lettura del file: " + error.message, "errore");
            }
        };
        reader.readAsText(file);
    });
}

console.log("Script admin caricato con visualizzazione dettagliata e gestione generi/sottogeneri");