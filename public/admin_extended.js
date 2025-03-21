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

// Cache libri
let cacheLibri = [];

// Elemento notifica
const notifica = document.createElement("div");
notifica.id = "notifica";
document.body.appendChild(notifica);

// Funzione per mostrare notifiche
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

// Amministratori autorizzati
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Autenticazione
firebase.auth().onAuthStateChanged(user => {
    console.log("Stato autenticazione cambiato", user ? user.email : "nessun utente");
    if (user && amministratoriAutorizzati.includes(user.email)) {
        if (loginContainer) loginContainer.style.display = "none";
        if (adminPanel) adminPanel.style.display = "block";
        caricaLibri();
    } else {
        if (loginContainer) loginContainer.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
        firebase.auth().signOut();
    }
});

// Login
if (loginButton) {
    loginButton.addEventListener("click", () => {
        console.log("Tentativo di login");
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
        console.log("Tentativo di logout");
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
    if (!libriInseriti) {
        console.log("Elemento libri-inseriti non trovato");
        return;
    }
    
    console.log("Caricamento libri...");
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        console.log(`Caricati ${cacheLibri.length} libri`);
        mostraLibriInseriti();
    }).catch(error => {
        console.error("Errore nel caricamento dei libri:", error);
        alert("Errore nel caricamento dei libri: " + error.message);
    });
}

// Upload immagine su Cloudinary
async function uploadImmagine(file) {
    if (!file) {
        console.log("Nessun file fornito per l'upload");
        return null;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "robpac_upload");
    formData.append("folder", "copertine");
    
    try {
        console.log("Uploading immagine...");
        const response = await fetch("https://api.cloudinary.com/v1_1/robpac/image/upload", { 
            method: "POST", 
            body: formData 
        });
        
        if (!response.ok) {
            console.error("Errore nella risposta di Cloudinary:", response.status);
            mostraNotifica("Errore nel caricamento dell'immagine", "errore");
            return null;
        }
        
        const data = await response.json();
        console.log("Immagine caricata con successo:", data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error("Errore nell'upload dell'immagine:", error);
        mostraNotifica("Errore nel caricamento dell'immagine", "errore");
        return null;
    }
}

// Gestione form aggiunta libro
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        console.log("Tentativo di aggiunta libro");
        
        const titolo = document.getElementById("titolo") ? document.getElementById("titolo").value.trim() : "";
        const autore = document.getElementById("autore") ? document.getElementById("autore").value.trim() : "";
        const descrizione = document.getElementById("descrizione") ? document.getElementById("descrizione").value.trim() : "";
        const linkAmazon = document.getElementById("linkAmazon") ? document.getElementById("linkAmazon").value.trim() : "";
        const prezzo = document.getElementById("prezzo") ? parseFloat(document.getElementById("prezzo").value.replace(",", ".")) : 0;
        const valuta = document.getElementById("valuta") ? document.getElementById("valuta").value : "$";
        const immagine = document.getElementById("immagine") && document.getElementById("immagine").files.length > 0 ? document.getElementById("immagine").files[0] : null;
        
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            alert("Tutti i campi devono essere compilati!");
            return;
        }
        
        // Controllo duplicati
        try {
            const snapshot = await firebase.database().ref("libri")
                .orderByChild("linkAmazon")
                .equalTo(linkAmazon)
                .once("value");
                
            if (snapshot.exists()) {
                mostraNotifica("Questo libro è già stato inserito", "errore");
                return;
            }
        } catch (error) {
            console.error("Errore controllo duplicati:", error);
            mostraNotifica("Errore nel controllo duplicati", "errore");
            return;
        }
        
        let urlImmagine = "placeholder.jpg";
        
        if (immagine) {
            urlImmagine = await uploadImmagine(immagine);
            if (!urlImmagine) {
                mostraNotifica("Caricamento immagine fallito", "errore");
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
        
        try {
            const libriRef = firebase.database().ref('libri').push();
            libro.id = libriRef.key;
            
            await libriRef.set(libro);
            console.log("Libro aggiunto:", libro);
            
            cacheLibri.push(libro);
            mostraLibriInseriti();
            mostraNotifica("Libro aggiunto con successo!");
            libroForm.reset();
        } catch (error) {
            console.error("Errore aggiunta libro:", error);
            mostraNotifica("Errore durante l'aggiunta del libro", "errore");
        }
    });
} else {
    console.log("Form libro non trovato nella pagina");
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

// Cache libri
let cacheLibri = [];

// Elemento notifica
const notifica = document.createElement("div");
notifica.id = "notifica";
document.body.appendChild(notifica);

// Funzione per mostrare notifiche
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

// Amministratori autorizzati
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Autenticazione
firebase.auth().onAuthStateChanged(user => {
    console.log("Stato autenticazione cambiato", user ? user.email : "nessun utente");
    if (user && amministratoriAutorizzati.includes(user.email)) {
        if (loginContainer) loginContainer.style.display = "none";
        if (adminPanel) adminPanel.style.display = "block";
        caricaLibri();
    } else {
        if (loginContainer) loginContainer.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
        firebase.auth().signOut();
    }
});

// Login
if (loginButton) {
    loginButton.addEventListener("click", () => {
        console.log("Tentativo di login");
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
        console.log("Tentativo di logout");
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
    if (!libriInseriti) {
        console.log("Elemento libri-inseriti non trovato");
        return;
    }
    
    console.log("Caricamento libri...");
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        console.log(`Caricati ${cacheLibri.length} libri`);
        mostraLibriInseriti();
    }).catch(error => {
        console.error("Errore nel caricamento dei libri:", error);
        alert("Errore nel caricamento dei libri: " + error.message);
    });
}

// Upload immagine su Cloudinary
async function uploadImmagine(file) {
    if (!file) {
        console.log("Nessun file fornito per l'upload");
        return null;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "robpac_upload");
    formData.append("folder", "copertine");
    
    try {
        console.log("Uploading immagine...");
        const response = await fetch("https://api.cloudinary.com/v1_1/robpac/image/upload", { 
            method: "POST", 
            body: formData 
        });
        
        if (!response.ok) {
            console.error("Errore nella risposta di Cloudinary:", response.status);
            mostraNotifica("Errore nel caricamento dell'immagine", "errore");
            return null;
        }
        
        const data = await response.json();
        console.log("Immagine caricata con successo:", data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error("Errore nell'upload dell'immagine:", error);
        mostraNotifica("Errore nel caricamento dell'immagine", "errore");
        return null;
    }
}

// Gestione form aggiunta libro
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        console.log("Tentativo di aggiunta libro");
        
        const titolo = document.getElementById("titolo") ? document.getElementById("titolo").value.trim() : "";
        const autore = document.getElementById("autore") ? document.getElementById("autore").value.trim() : "";
        const descrizione = document.getElementById("descrizione") ? document.getElementById("descrizione").value.trim() : "";
        const linkAmazon = document.getElementById("linkAmazon") ? document.getElementById("linkAmazon").value.trim() : "";
        const prezzo = document.getElementById("prezzo") ? parseFloat(document.getElementById("prezzo").value.replace(",", ".")) : 0;
        const valuta = document.getElementById("valuta") ? document.getElementById("valuta").value : "$";
        const immagine = document.getElementById("immagine") && document.getElementById("immagine").files.length > 0 ? document.getElementById("immagine").files[0] : null;
        
        if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
            alert("Tutti i campi devono essere compilati!");
            return;
        }
        
        // Controllo duplicati
        try {
            const snapshot = await firebase.database().ref("libri")
                .orderByChild("linkAmazon")
                .equalTo(linkAmazon)
                .once("value");
                
            if (snapshot.exists()) {
                mostraNotifica("Questo libro è già stato inserito", "errore");
                return;
            }
        } catch (error) {
            console.error("Errore controllo duplicati:", error);
            mostraNotifica("Errore nel controllo duplicati", "errore");
            return;
        }
        
        let urlImmagine = "placeholder.jpg";
        
        if (immagine) {
            urlImmagine = await uploadImmagine(immagine);
            if (!urlImmagine) {
                mostraNotifica("Caricamento immagine fallito", "errore");
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
        
        try {
            const libriRef = firebase.database().ref('libri').push();
            libro.id = libriRef.key;
            
            await libriRef.set(libro);
            console.log("Libro aggiunto:", libro);
            
            cacheLibri.push(libro);
            mostraLibriInseriti();
            mostraNotifica("Libro aggiunto con successo!");
            libroForm.reset();
        } catch (error) {
            console.error("Errore aggiunta libro:", error);
            mostraNotifica("Errore durante l'aggiunta del libro", "errore");
        }
    });
} else {
    console.log("Form libro non trovato nella pagina");
}

// Funzione per eliminare un libro
function eliminaLibro(id) {
    if (!id) {
        console.error("ID libro mancante");
        return;
    }
    
    if (confirm("Sei sicuro di voler eliminare questo libro?")) {
        console.log("Tentativo di eliminazione libro:", id);
        firebase.database().ref(`libri/${id}`).remove()
            .then(() => {
                console.log("Libro eliminato con successo");
                cacheLibri = cacheLibri.filter(libro => libro.id !== id);
                mostraLibriInseriti();
                mostraNotifica("Libro eliminato con successo!");
            })
            .catch(error => {
                console.error("Errore eliminazione libro:", error);
                mostraNotifica("Errore durante l'eliminazione", "errore");
            });
    }
}

// Mostra libri
function mostraLibriInseriti() {
    if (!libriInseriti) {
        console.log("Elemento libri-inseriti non trovato");
        return;
    }
    
    console.log("Aggiornamento visualizzazione libri");
    libriInseriti.innerHTML = "";
    
    if (cacheLibri.length === 0) {
        libriInseriti.innerHTML = "<p>Nessun libro presente nel catalogo</p>";
        return;
    }
    
    let libriFiltrati = [...cacheLibri];
    
    // Filtro
    if (filtroTesto && filtroTesto.value) {
        const testoFiltro = filtroTesto.value.toLowerCase();
        libriFiltrati = libriFiltrati.filter(libro =>
            libro.titolo && libro.titolo.toLowerCase().includes(testoFiltro) ||
            libro.autore && libro.autore.toLowerCase().includes(testoFiltro)
        );
    }
    
    // Ordinamento
    if (ordinamento && ordinamento.value) {
        const criterio = ordinamento.value;
        libriFiltrati.sort((a, b) => {
            if (criterio === "prezzo") {
                return parseFloat(a.prezzo || 0) - parseFloat(b.prezzo || 0);
            }
            return (a[criterio] || "").localeCompare(b[criterio] || "");
        });
    }
    
    // Mostra ogni libro
    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        
        div.innerHTML = `
            <h3>${libro.titolo || "Titolo mancante"}</h3>
            <p>Autore: ${libro.autore || "Autore mancante"}</p>
            <p>Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}</p>
            <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo || "Copertina libro"}" style="width:100px; height:150px;">
            <button class="btn-elimina" data-id="${libro.id}">❌ Elimina</button>
        `;
        
        libriInseriti.appendChild(div);
    });
    
    // Aggiungi listener ai pulsanti elimina
    document.querySelectorAll(".btn-elimina").forEach(button => {
        button.addEventListener("click", function() {
            const id = this.getAttribute("data-id");
            if (id) eliminaLibro(id);
        });
    });
    
    console.log(`Visualizzati ${libriFiltrati.length} libri`);
}

// Event listener per filtro e ordinamento
if (filtroTesto) {
    filtroTesto.addEventListener("input", mostraLibriInseriti);
}

if (ordinamento) {
    ordinamento.addEventListener("change", mostraLibriInseriti);
}

// Disabilitazione formati disponibili
try {
    ["ebook", "paperback", "hardcover"].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = true;
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) label.style.display = "none";
        }
    });
} catch (error) {
    console.log("Impossibile disabilitare i formati");
}

console.log("Script di admin esteso caricato");
