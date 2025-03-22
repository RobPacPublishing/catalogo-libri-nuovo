// CONFIGURAZIONE FIREBASE
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
}

// Elementi DOM
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const libroForm = document.getElementById("libro-form");
const libriInseriti = document.getElementById("libri-inseriti");
const filtroTesto = document.getElementById("filtroTesto");
const ordinamento = document.getElementById("ordinamento");
const messaggioFeedback = document.getElementById("messaggio-feedback");

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
    }, 5000);
}

// Lista amministratori
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Controlla autenticazione
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
if (loginButton) {
    loginButton.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                alert(`Benvenuto ${result.user.displayName}!`);
                setTimeout(() => location.reload(), 1000);
            })
            .catch(error => alert("Errore di autenticazione: " + error.message));
    });
}

// Logout
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        firebase.auth().signOut()
            .then(() => {
                alert("Logout effettuato con successo!");
                location.reload();
            })
            .catch(error => alert("Errore nel logout"));
    });
}

// Carica libri dal database
function caricaLibri() {
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        mostraLibriInseriti();
    }).catch(error => alert("Errore nel caricamento dei libri: " + error.message));
}

// Upload immagine su Cloudinary
async function uploadImmagine(file) {
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
            mostraNotifica("Errore nel caricamento dell'immagine. Riprova.", "errore");
            return null;
        }
        
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        mostraNotifica("Errore nel caricamento dell'immagine: " + error.message, "errore");
        return null;
    }
}

// Gestione form aggiunta libro
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const titolo = document.getElementById("titolo")?.value.trim() || "";
        const autore = document.getElementById("autore")?.value.trim() || "";
        const descrizione = document.getElementById("descrizione")?.value.trim() || "";
        const linkAmazon = document.getElementById("linkAmazon")?.value.trim() || "";
        const prezzo = parseFloat(document.getElementById("prezzo")?.value.replace(",", ".")) || 0;
        const valuta = document.getElementById("valuta")?.value || "$";
        const immagine = document.getElementById("immagine")?.files[0] || null;
        
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            alert("⚠️ Tutti i campi devono essere compilati!");
            return;
        }
        
        // Controllo duplicati
        const snapshot = await firebase.database().ref("libri")
            .orderByChild("linkAmazon")
            .equalTo(linkAmazon)
            .once("value");
            
        if (snapshot.exists()) {
            mostraNotifica("🚫 Questo libro è già stato inserito (link Amazon duplicato)", "errore");
            return;
        }
        
        let urlImmagine = "placeholder.jpg";
        
        if (immagine) {
            urlImmagine = await uploadImmagine(immagine);
            if (!urlImmagine) {
                mostraNotifica("Caricamento immagine fallito. Il libro non è stato salvato.", "errore");
                return;
            }
        }
        
        const libro = {
            titolo,
            autore,
            descrizione,
            linkAmazon,
            prezzo: prezzo.toFixed(2),
            valuta,
            immagine: urlImmagine
        };
        
        const libriRef = firebase.database().ref('libri').push();
        libro.id = libriRef.key;
        
        libriRef.set(libro).then(() => {
            // Aggiorna cache
            cacheLibri.push(libro);
            
            // Aggiorna visualizzazione
            mostraLibriInseriti();
            mostraNotifica("📚 Libro aggiunto con successo!");
            libroForm.reset();
        }).catch(error => {
            mostraNotifica("❌ Errore durante l'aggiunta del libro: " + error.message, "errore");
        });
    });
}

// Funzione per mostrare i libri
function mostraLibriInseriti() {
    if (!libriInseriti) return;
    
    libriInseriti.innerHTML = "";
    
    let libriFiltrati = [...cacheLibri];
    
    // Filtraggio
    if (filtroTesto && filtroTesto.value) {
        const testoFiltro = filtroTesto.value.toLowerCase();
        libriFiltrati = libriFiltrati.filter(libro =>
            libro.titolo.toLowerCase().includes(testoFiltro) ||
            libro.autore.toLowerCase().includes(testoFiltro)
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
            return a[criterio].localeCompare(b[criterio]);
        });
    }
    
    // Mostra libri
    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        
        div.innerHTML = `
        <h3>${libro.titolo}</h3>
        <p>Autore: ${libro.autore}</p>
        <p>Prezzo: ${libro.valuta} ${libro.prezzo}</p>
        <img src="${libro.immagine}" alt="${libro.titolo}" style="width:100px; height:150px;">
        <button class="elimina-libro" data-id="${libro.id}">❌ Elimina</button>
        `;
        
        libriInseriti.appendChild(div);
    });
    
    // Aggiungi event listener ai pulsanti elimina
    document.querySelectorAll(".elimina-libro").forEach(button => {
        button.addEventListener("click", function() {
            const libroId = this.getAttribute("data-id");
            eliminaLibro(libroId);
        });
    });
}

// Funzione per eliminare un libro
function eliminaLibro(libroId) {
    const confermaDiv = document.createElement("div");
    confermaDiv.classList.add("notifica-conferma");
    
    confermaDiv.innerHTML = `
    <p>❗ Sei sicuro di voler eliminare questo libro?</p>
    <button id="conferma-elimina">✅ Conferma</button>
    <button id="annulla-elimina">❌ Annulla</button>
    `;
    
    document.body.appendChild(confermaDiv);
    
    document.getElementById("conferma-elimina").addEventListener("click", () => {
        firebase.database().ref(`libri/${libroId}`).remove()
        .then(() => {
            cacheLibri = cacheLibri.filter(libro => libro.id !== libroId);
            mostraLibriInseriti();
            mostraNotifica("📚 Libro eliminato con successo!");
        })
        .catch(error => mostraNotifica("❌ Errore durante l'eliminazione del libro: " + error.message, "errore"));
        
        confermaDiv.remove();
    });
    
    document.getElementById("annulla-elimina").addEventListener("click", () => {
        mostraNotifica("❌ Eliminazione annullata.");
        confermaDiv.remove();
    });
}

// Event listener per filtro e ordinamento
if (filtroTesto) {
    filtroTesto.addEventListener("input", mostraLibriInseriti);
}

if (ordinamento) {
    ordinamento.addEventListener("change", mostraLibriInseriti);
}

// Console log per verificare caricamento
console.log("Admin script caricato correttamente");