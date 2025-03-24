// CONFIGURAZIONE FIREBASE
// NOTA: In ambiente di produzione, queste credenziali dovrebbero essere protette
const firebaseConfig = {
    apiKey: "AIzaSyAOIp2reVVoeikYjZUk73yQpZNPaDVvCkw",
    authDomain: "aggiungilibri.firebaseapp.com",
    databaseURL: "https://aggiungilibri-default-rtdb.firebaseio.com",
    projectId: "aggiungilibri",
    storageBucket: "aggiungilibri.appspot.com",
    messagingSenderId: "215130413037",
    appId: "1:215130413037:web:058d3395ddef3b7441f9e4"
};

// Inizializzazione Firebase (solo se non è già inizializzato)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

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
const immagineInput = document.getElementById("immagine");
const immaginePreview = document.getElementById("immagine-preview");
const previewImg = document.getElementById("preview-img");
const rimuoviImmagineBtn = document.getElementById("rimuovi-immagine");
const genereSelect = document.getElementById("genere");
const sottogenereSelect = document.getElementById("sottogenere");
const esportaDatiButton = document.getElementById("esporta-dati");
const importaDatiInput = document.getElementById("importa-dati");
const caricaDatiButton = document.getElementById("carica-dati");

// Categorie predefinite
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

// Variabili per la modifica libri
let libroCorrente = null; // Per tenere traccia del libro in fase di modifica
let nuovaImmagine = null; // Per tenere traccia della nuova immagine selezionata

// DISABILITA TEMPORANEAMENTE FORMATI DISPONIBILI
["ebook", "paperback", "hardcover"].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.disabled = true;
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) label.style.display = "none";
    }
});

// Cache libri
let cacheLibri = [];

// Notifiche - crea e aggiunge elemento notifica al body
const notifica = document.createElement("div");
notifica.id = "notifica";
document.body.appendChild(notifica);

// Lista amministratori autorizzati
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Sistema di notifiche migliorato
function mostraNotifica(testo, tipo = "successo") {
    if (!testo) return;
    
    console.log(`Notifica (${tipo}): ${testo}`);
    
    notifica.textContent = testo;
    notifica.className = tipo === "errore" ? "notifica-errore" : "notifica-successo";
    notifica.style.display = "block";
    notifica.style.opacity = "1";
    
    // Nascondi dopo un timeout
    setTimeout(() => {
        notifica.style.opacity = "0";
        setTimeout(() => { notifica.style.display = "none"; }, 500);
    }, 5000);
}

// Aggiorna sottogeneri in base al genere selezionato
function aggiornaSottogeneri() {
    if (!genereSelect || !sottogenereSelect) return;
    
    const genereSelezionato = genereSelect.value;
    
    // Pulisci il dropdown
    sottogenereSelect.innerHTML = '<option value="">Seleziona sottogenere</option>';
    
    if (genereSelezionato && CATEGORIES[genereSelezionato]) {
        // Aggiungi sottogeneri per il genere selezionato
        CATEGORIES[genereSelezionato].forEach(sottogenere => {
            const option = document.createElement('option');
            option.value = sottogenere;
            option.textContent = sottogenere;
            sottogenereSelect.appendChild(option);
        });
    }
}

// Event listener per il cambio di genere
if (genereSelect) {
    genereSelect.addEventListener('change', aggiornaSottogeneri);
}

// Gestione preview immagine
if (immagineInput && immaginePreview && previewImg && rimuoviImmagineBtn) {
    immagineInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                immaginePreview.style.display = "block";
                nuovaImmagine = file;
            };
            reader.readAsDataURL(file);
        }
    });
    
    rimuoviImmagineBtn.addEventListener('click', function() {
        previewImg.src = "";
        immaginePreview.style.display = "none";
        immagineInput.value = "";
        nuovaImmagine = null;
    });
}

// Controlla autenticazione
firebase.auth().onAuthStateChanged(user => {
    if (user && amministratoriAutorizzati.includes(user.email)) {
        // Utente autenticato e autorizzato
        if (loginContainer) loginContainer.style.display = "none";
        if (adminPanel) adminPanel.style.display = "block";
        caricaLibri();
        aggiornaSottogeneri(); // Inizializza il dropdown dei sottogeneri
    } else {
        // Utente non autenticato o non autorizzato
        if (loginContainer) loginContainer.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
        firebase.auth().signOut().catch(error => {
            console.error("Errore durante il logout:", error);
        });
    }
});

// Login con Google
if (loginButton) {
    loginButton.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                mostraNotifica(`Benvenuto ${result.user.displayName}!`);
                setTimeout(() => {
                    // Aggiorna la visualizzazione senza ricaricare la pagina
                    if (loginContainer) loginContainer.style.display = "none";
                    if (adminPanel) adminPanel.style.display = "block";
                    caricaLibri();
                    aggiornaSottogeneri();
                }, 1000);
            })
            .catch(error => {
                mostraNotifica("Errore di autenticazione: " + error.message, "errore");
                console.error("Errore di autenticazione:", error);
            });
    });
}

// Logout
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        firebase.auth().signOut()
            .then(() => {
                mostraNotifica("Logout effettuato con successo!");
                // Aggiorna la visualizzazione senza ricaricare la pagina
                if (loginContainer) loginContainer.style.display = "block";
                if (adminPanel) adminPanel.style.display = "none";
                cacheLibri = [];
            })
            .catch(error => {
                mostraNotifica("Errore nel logout: " + error.message, "errore");
                console.error("Errore nel logout:", error);
            });
    });
}

// Carica libri dal database
function caricaLibri() {
    if (!libriInseriti) {
        console.error("Elemento libri-inseriti non trovato nel DOM");
        return;
    }
    
    // Mostra indicatore di caricamento
    libriInseriti.innerHTML = "<p>Caricamento libri in corso...</p>";
    
    firebase.database().ref('libri').once('value')
        .then(snapshot => {
            cacheLibri = snapshot.val() 
                ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) 
                : [];
            
            mostraLibriInseriti();
            
            if (cacheLibri.length === 0) {
                mostraNotifica("Nessun libro trovato nel database");
            } else {
                mostraNotifica(`Caricati ${cacheLibri.length} libri`);
            }
        })
        .catch(error => {
            libriInseriti.innerHTML = "<p>Errore nel caricamento dei libri</p>";
            mostraNotifica("Errore nel caricamento dei libri: " + error.message, "errore");
            console.error("Errore nel caricamento dei libri:", error);
        });
}

// Funzione per resettare il form
function resetForm() {
    if (libroForm) {
        libroForm.reset();
    }
    
    if (immaginePreview) {
        immaginePreview.style.display = "none";
    }
    
    if (previewImg) {
        previewImg.src = "";
    }
    
    nuovaImmagine = null;
    libroCorrente = null;
    
    // Cambia il testo del pulsante submit
    const submitButton = libroForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Aggiungi libro";
    }
}

// Upload immagine su Cloudinary
async function uploadImmagine(file) {
    if (!file) {
        console.log("Nessun file fornito per l'upload");
        return null;
    }
    
    mostraNotifica("Caricamento immagine in corso...");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "robpac_upload");
    formData.append("folder", "copertine");
    
    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/robpac/image/upload", { 
            method: "POST", 
            body: formData 
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Errore HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        mostraNotifica("Immagine caricata con successo");
        return data.secure_url;
    } catch (error) {
        mostraNotifica("Errore nel caricamento dell'immagine: " + error.message, "errore");
        console.error("Errore upload immagine:", error);
        return null;
    }
}

// Gestione form aggiunta/modifica libro
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        // Ottieni i valori con gestione null/undefined
        const titolo = document.getElementById("titolo")?.value.trim() || "";
        const autore = document.getElementById("autore")?.value.trim() || "";
        const descrizione = document.getElementById("descrizione")?.value.trim() || "";
        const linkAmazon = document.getElementById("linkAmazon")?.value.trim() || "";
        const prezzoInput = document.getElementById("prezzo")?.value.replace(",", ".") || "0";
        const prezzo = parseFloat(prezzoInput);
        const valuta = document.getElementById("valuta")?.value || "$";
        const genere = genereSelect?.value || "";
        const sottogenere = sottogenereSelect?.value || "";
        
        // Validazione base
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            mostraNotifica("⚠️ Tutti i campi devono essere compilati!", "errore");
            return;
        }
        
        try {
            // Se stiamo modificando un libro esistente
            if (libroCorrente) {
                // Gestione immagine
                let urlImmagine = libroCorrente.immagine;
                
                if (nuovaImmagine) {
                    const nuovaUrlImmagine = await uploadImmagine(nuovaImmagine);
                    if (nuovaUrlImmagine) {
                        urlImmagine = nuovaUrlImmagine;
                    }
                }
                
                // Aggiorna l'oggetto libro
                const libroAggiornato = {
                    ...libroCorrente,
                    titolo,
                    autore,
                    descrizione,
                    linkAmazon,
                    prezzo: prezzo.toFixed(2),
                    valuta,
                    genere,
                    sottogenere,
                    immagine: urlImmagine,
                    dataModifica: new Date().toISOString()
                };
                
                // Aggiorna nel database
                await firebase.database().ref(`libri/${libroCorrente.id}`).update(libroAggiornato);
                
                // Aggiorna in cache
                const index = cacheLibri.findIndex(libro => libro.id === libroCorrente.id);
                if (index !== -1) {
                    cacheLibri[index] = libroAggiornato;
                }
                
                mostraNotifica("📚 Libro aggiornato con successo!");
                resetForm();
                mostraLibriInseriti();
            } 
            // Altrimenti, aggiungiamo un nuovo libro
            else {
                // Controlla se il libro esiste già (controllo duplicati)
                const snapshot = await firebase.database().ref("libri")
                    .orderByChild("linkAmazon")
                    .equalTo(linkAmazon)
                    .once("value");
                    
                if (snapshot.exists()) {
                    mostraNotifica("🚫 Questo libro è già stato inserito (link Amazon duplicato)", "errore");
                    return;
                }
                
                // Gestione immagine
                let urlImmagine = "placeholder.jpg";
                
                if (nuovaImmagine) {
                    urlImmagine = await uploadImmagine(nuovaImmagine);
                    if (!urlImmagine) {
                        mostraNotifica("Caricamento immagine fallito. Continua con immagine placeholder?", "errore");
                        // Continua con l'immagine di placeholder se l'utente conferma
                        if (!confirm("Continuare con un'immagine placeholder?")) {
                            return;
                        }
                    }
                }
                
                // Crea oggetto libro
                const libro = {
                    titolo,
                    autore,
                    descrizione,
                    linkAmazon,
                    prezzo: prezzo.toFixed(2),
                    valuta,
                    genere,
                    sottogenere,
                    immagine: urlImmagine,
                    dataInserimento: new Date().toISOString()
                };
                
                // Salva nel database
                const libriRef = firebase.database().ref('libri').push();
                libro.id = libriRef.key;
                
                await libriRef.set(libro);
                
                // Aggiorna cache locale e UI
                cacheLibri.push(libro);
                mostraLibriInseriti();
                mostraNotifica("📚 Libro aggiunto con successo!");
                resetForm();
            }
            
            // Scroll alla lista libri
            if (libriInseriti) {
                libriInseriti.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            mostraNotifica("❌ Errore durante l'operazione: " + error.message, "errore");
            console.error("Errore durante l'operazione:", error);
        }
    });
}

// Funzione per mostrare i libri
function mostraLibriInseriti() {
    if (!libriInseriti) return;
    
    libriInseriti.innerHTML = "";
    
    if (cacheLibri.length === 0) {
        libriInseriti.innerHTML = "<p>Nessun libro presente nel catalogo</p>";
        return;
    }
    
    let libriFiltrati = [...cacheLibri];
    
    // Filtraggio
    if (filtroTesto && filtroTesto.value) {
        const testoFiltro = filtroTesto.value.toLowerCase();
        libriFiltrati = libriFiltrati.filter(libro =>
            (libro.titolo && libro.titolo.toLowerCase().includes(testoFiltro)) ||
            (libro.autore && libro.autore.toLowerCase().includes(testoFiltro)) ||
            (libro.genere && libro.genere.toLowerCase().includes(testoFiltro)) ||
            (libro.sottogenere && libro.sottogenere.toLowerCase().includes(testoFiltro))
        );
    }
    
    // Ordinamento
    if (ordinamento && ordinamento.value) {
        const criterio = ordinamento.value;
        libriFiltrati.sort((a, b) => {
            if (criterio === "prezzo") {
                const prezzoA = isNaN(parseFloat(a.prezzo)) ? 0 : parseFloat(a.prezzo);
                const prezzoB = isNaN(parseFloat(b.prezzo)) ? 0 : parseFloat(b.prezzo);
                return prezzoA - prezzoB;
            }
            
            // Per altri criteri (titolo, autore, ecc.)
            const valA = a[criterio] || "";
            const valB = b[criterio] || "";
            return valA.localeCompare(valB);
        });
    }
    
    // Mostra libri
    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        
        div.innerHTML = `
        <div class="libro-preview">
            <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" 
                style="width:100px; height:150px; object-fit:cover;">
            <h3>${libro.titolo || "Titolo mancante"}</h3>
            <p>Autore: ${libro.autore || "Autore mancante"}</p>
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
    
    // Aggiungi event listener ai pulsanti elimina
    document.querySelectorAll(".btn-elimina").forEach(button => {
        button.addEventListener("click", function() {
            const libroId = this.getAttribute("data-id");
            eliminaLibro(libroId);
        });
    });
    
    // Aggiungi event listener ai pulsanti dettagli
    document.querySelectorAll(".btn-dettagli").forEach(button => {
        button.addEventListener("click", function() {
            const libroId = this.getAttribute("data-id");
            mostraDettagliLibro(libroId);
        });
    });
    
    // Aggiungi event listener ai pulsanti modifica
    document.querySelectorAll(".btn-modifica").forEach(button => {
        button.addEventListener("click", function() {
            const libroId = this.getAttribute("data-id");
            preparaModificaLibro(libroId);
        });
    });
}

// Funzione per mostrare dettagli libro
function mostraDettagliLibro(libroId) {
    const libro = cacheLibri.find(libro => libro.id === libroId);
    if (!libro) {
        mostraNotifica("Libro non trovato", "errore");
        return;
    }
    
    // Crea modal per i dettagli
    const modal = document.createElement("div");
    modal.className = "modal";
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="libro-dettagli">
                <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" class="dettagli-img">
                <div class="libro-info">
                    <h2>${libro.titolo || "Titolo non disponibile"}</h2>
                    <p>Autore: ${libro.autore || "Non specificato"}</p>
                    <p>Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}</p>
                    ${libro.genere ? `<p class="libro-genere">Genere: ${libro.genere}</p>` : ''}
                    ${libro.sottogenere ? `<p class="libro-sottogenere">Sottogenere: ${libro.sottogenere}</p>` : ''}
                    <p>Link Amazon: <a href="${libro.linkAmazon}" target="_blank">${libro.linkAmazon}</a></p>
                    ${libro.dataInserimento ? `<p>Data inserimento: ${new Date(libro.dataInserimento).toLocaleDateString()}</p>` : ''}
                    ${libro.dataModifica ? `<p>Ultima modifica: ${new Date(libro.dataModifica).toLocaleDateString()}</p>` : ''}
                </div>
            </div>
            <div class="libro-descrizione">
                <h3>Descrizione</h3>
                <p>${libro.descrizione || "Nessuna descrizione disponibile."}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gestisci chiusura modal
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
        modal.remove();
    });
    
    // Chiudi modal cliccando fuori
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

// Funzione per preparare la modifica di un libro
function preparaModificaLibro(libroId) {
    const libro = cacheLibri.find(libro => libro.id === libroId);
    if (!libro) {
        mostraNotifica("Libro non trovato", "errore");
        return;
    }
    
    // Salva il libro corrente nel contesto
    libroCorrente = libro;
    
    // Popola il form con i dati del libro
    if (document.getElementById("titolo")) document.getElementById("titolo").value = libro.titolo || "";
    if (document.getElementById("autore")) document.getElementById("autore").value = libro.autore || "";
    if (document.getElementById("descrizione")) document.getElementById("descrizione").value = libro.descrizione || "";
    if (document.getElementById("linkAmazon")) document.getElementById("linkAmazon").value = libro.linkAmazon || "";
    if (document.getElementById("prezzo")) document.getElementById("prezzo").value = libro.prezzo || "0.00";
    if (document.getElementById("valuta")) document.getElementById("valuta").value = libro.valuta || "$";
    
    // Gestisci l'anteprima dell'immagine
    if (previewImg && immaginePreview && libro.immagine) {
        previewImg.src = libro.immagine;
        immaginePreview.style.display = "block";
    }
    
    // Seleziona genere e sottogenere
    if (genereSelect && libro.genere) {
        genereSelect.value = libro.genere;
        aggiornaSottogeneri(); // Aggiorna le opzioni dei sottogeneri
        
        // Seleziona il sottogenere dopo aver aggiornato le opzioni
        setTimeout(() => {
            if (sottogenereSelect && libro.sottogenere) {
                sottogenereSelect.value = libro.sottogenere;
            }
        }, 100);
    }
    
    // Cambia il testo del pulsante submit
    const submitButton = libroForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Aggiorna libro";
    }
    
    // Crea pulsante annulla
    let cancelButton = document.getElementById("annulla-modifica");
    if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.id = "annulla-modifica";
        cancelButton.type = "button";
        cancelButton.textContent = "Annulla modifica";
        cancelButton.style.backgroundColor = "#999";
        cancelButton.style.marginTop = "10px";
        libroForm.appendChild(cancelButton);
    } else {
        cancelButton.style.display = "inline-block";
    }
    
    // Event listener per annullare
    cancelButton.addEventListener("click", () => {
        resetForm();
        if (cancelButton) {
            cancelButton.style.display = "none";
        }
    });
    
    // Scroll al form
    libroForm.scrollIntoView({ behavior: 'smooth' });
    mostraNotifica("Modifica libro in corso...");
}

// Funzione per eliminare un libro
function eliminaLibro(libroId) {
    if (!libroId) {
        mostraNotifica("ID libro mancante", "errore");
        return;
    }
    
    // Crea un div per la conferma di eliminazione
    const confermaDiv = document.createElement("div");
    confermaDiv.classList.add("notifica-conferma");
    
    confermaDiv.innerHTML = `
    <p>❗ Sei sicuro di voler eliminare questo libro?</p>
    <button id="conferma-elimina">✅ Conferma</button>
    <button id="annulla-elimina">❌ Annulla</button>
    `;
    
    document.body.appendChild(confermaDiv);
    
    // Event listener per conferma eliminazione
    document.getElementById("conferma-elimina").addEventListener("click", () => {
        firebase.database().ref(`libri/${libroId}`).remove()
        .then(() => {
            // Aggiorna la cache locale
            cacheLibri = cacheLibri.filter(libro => libro.id !== libroId);
            mostraLibriInseriti();
            mostraNotifica("📚 Libro eliminato con successo!");
        })
        .catch(error => {
            mostraNotifica("❌ Errore durante l'eliminazione del libro: " + error.message, "errore");
            console.error("Errore durante l'eliminazione del libro:", error);
        })
        .finally(() => {
            confermaDiv.remove(); // Rimuove la finestra di conferma
        });
    });
    
    // Event listener per annullare eliminazione
    document.getElementById("annulla-elimina").addEventListener("click", () => {
        mostraNotifica("❌ Eliminazione annullata.");
        confermaDiv.remove(); // Rimuove la finestra di conferma
    });
}

// Event listener per filtro e ordinamento
if (filtroTesto) {
    filtroTesto.addEventListener("input", mostraLibriInseriti);
}

if (ordinamento) {
    ordinamento.addEventListener("change", mostraLibriInseriti);
}

// Funzione di esportazione dati
function esportaBackup() {
    if (cacheLibri.length === 0) {
        mostraNotifica("Nessun libro da esportare", "errore");
        return;
    }
    
    const dataStr = JSON.stringify(cacheLibri, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = "libri_backup_" + new Date().toISOString().slice(0, 10) + ".json";
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    mostraNotifica("📥 Dati esportati con successo!");
}

// Funzione di importazione dati
async function importaBackup(file) {
    if (!file) {
        mostraNotifica("Nessun file selezionato", "errore");
        return;
    }
    
    try {
        mostraNotifica("Lettura del file in corso...");
        
        // Leggi il file
        const reader = new FileReader();
        
        // Converti la lettura del file in una Promise
        const fileContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
        
        // Analizza il contenuto JSON
        let libriImportati = JSON.parse(fileContent);
        
        // Verifica che sia un array
        if (!Array.isArray(libriImportati)) {
            throw new Error("Il formato del file non è valido. Deve contenere un array di libri.");
        }
        
        // Chiedi conferma all'utente se sovrascrivere tutti i dati
        if (!confirm("⚠️ Questa operazione potrebbe sovrascrivere i libri esistenti. Continuare?")) {
            mostraNotifica("Importazione annullata");
            return;
        }
        
        mostraNotifica("Importazione in corso...");
        
        // Prepara gli aggiornamenti
        const updates = {};
        
        // Gestisci ogni libro dell'importazione
        libriImportati.forEach(libro => {
            // Assicurati che ogni libro abbia un ID
            const id = libro.id || firebase.database().ref('libri').push().key;
            
            // Rimuovi l'ID dall'oggetto libro (sarà usato come chiave)
            const { id: _, ...libroSenzaId } = libro;
            
            // Aggiungi il libro all'oggetto updates
            updates[`libri/${id}`] = {
                ...libroSenzaId,
                id
            };
        });
        
        // Esegui l'aggiornamento al database
        await firebase.database().ref().update(updates);
        
        // Ricarica i libri
        caricaLibri();
        
        mostraNotifica(`📤 Importati con successo ${libriImportati.length} libri!`);
    } catch (error) {
        mostraNotifica("❌ Errore durante l'importazione: " + error.message, "errore");
        console.error("Errore durante l'importazione:", error);
    }
}

// Collega i pulsanti di esportazione/importazione
if (esportaDatiButton) {
    esportaDatiButton.addEventListener("click", esportaBackup);
}

if (caricaDatiButton && importaDatiInput) {
    caricaDatiButton.addEventListener("click", () => {
        const file = importaDatiInput.files[0];
        importaBackup(file);
    });
}

// Stili CSS per il Modal
const modalStyles = document.createElement("style");
modalStyles.textContent = `
    .modal {
        display: flex;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        justify-content: center;
        align-items: center;
    }
    
    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    
    .close-modal {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        cursor: pointer;
    }
    
    .libro-dettagli {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .dettagli-img {
        width: 200px;
        height: auto;
        object-fit: contain;
    }
    
    .libro-info {
        flex: 1;
        min-width: 250px;
    }
    
    .libro-descrizione {
        border-top: 1px solid #ddd;
        padding-top: 15px;
    }
    
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            padding: 15px;
        }
        
        .libro-dettagli {
            flex-direction: column;
        }
        
        .dettagli-img {
            width: 150px;
            margin: 0 auto;
        }
    }
`;

document.head.appendChild(modalStyles);

// Console log per verificare caricamento
console.log("Script admin.js caricato correttamente (versione ottimizzata)");