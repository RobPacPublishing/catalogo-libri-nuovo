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

// Elementi DOM principali
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const libroForm = document.getElementById("libro-form");
const libriInseriti = document.getElementById("libri-inseriti");
const filtroTesto = document.getElementById("filtroTesto");
const ordinamento = document.getElementById("ordinamento");

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
    setTimeout(() => { notifica.style.display = "none"; }, 3000);
}

// Autenticazione
firebase.auth().onAuthStateChanged(user => {
    if (user && amministratoriAutorizzati.includes(user.email)) {
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
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

// Carica libri
function caricaLibri() {
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        mostraLibriInseriti();
    }).catch(error => alert("Errore nel caricamento dei libri: " + error.message));
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
            (libro.autore && libro.autore.toLowerCase().includes(testoFiltro))
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
            <h3>${libro.titolo || "Titolo"}</h3>
            <p>Autore: ${libro.autore || "Autore"}</p>
            <p>Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}</p>
            <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" style="width:100px; height:150px;">
            <div class="admin-libro-buttons">
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
}

// Elimina libro
function eliminaLibro(id) {
    if (confirm("Sei sicuro di voler eliminare questo libro?")) {
        firebase.database().ref(`libri/${id}`).remove()
            .then(() => {
                cacheLibri = cacheLibri.filter(libro => libro.id !== id);
                mostraLibriInseriti();
                mostraNotifica("Libro eliminato con successo!");
            })
            .catch(error => mostraNotifica("Errore durante l'eliminazione", "errore"));
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
        
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            alert("Tutti i campi devono essere compilati!");
            return;
        }
        
        // Se libroCorrente esiste, stiamo modificando, altrimenti stiamo aggiungendo
        if (libroCorrente) {
            // MODIFICA LIBRO ESISTENTE
            const libro = {
                ...libroCorrente,
                titolo,
                autore,
                descrizione,
                linkAmazon,
                prezzo: prezzo.toFixed(2),
                valuta
            };
            
            firebase.database().ref(`libri/${libroCorrente.id}`).update(libro)
                .then(() => {
                    // Aggiorna nella cache
                    const index = cacheLibri.findIndex(l => l.id === libroCorrente.id);
                    if (index !== -1) {
                        cacheLibri[index] = libro;
                    }
                    
                    mostraLibriInseriti();
                    mostraNotifica("Libro aggiornato con successo!");
                    
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
                    mostraNotifica("Errore durante l'aggiornamento del libro: " + error.message, "errore");
                });
        } else {
            // AGGIUNGI NUOVO LIBRO
            const libro = {
                titolo,
                autore,
                descrizione,
                linkAmazon,
                prezzo: prezzo.toFixed(2),
                valuta,
                immagine: "placeholder.jpg"
            };
            
            const libriRef = firebase.database().ref('libri').push();
            libro.id = libriRef.key;
            
            libriRef.set(libro).then(() => {
                cacheLibri.push(libro);
                mostraLibriInseriti();
                mostraNotifica("Libro aggiunto con successo!");
                libroForm.reset();
            }).catch(error => {
                mostraNotifica("Errore durante l'aggiunta del libro", "errore");
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

// Aggiungi stili per i pulsanti
const style = document.createElement('style');
style.textContent = `
.admin-libro-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}
.btn-modifica {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
}
.btn-elimina {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
}
`;
document.head.appendChild(style);

console.log("Script admin semplice caricato con funzionalità di modifica");