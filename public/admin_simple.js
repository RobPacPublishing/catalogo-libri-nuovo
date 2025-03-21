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
    
    cacheLibri.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        
        div.innerHTML = `
            <h3>${libro.titolo || "Titolo"}</h3>
            <p>Autore: ${libro.autore || "Autore"}</p>
            <p>Prezzo: ${libro.valuta || "$"} ${libro.prezzo || "0.00"}</p>
            <img src="${libro.immagine || "placeholder.jpg"}" alt="${libro.titolo}" style="width:100px; height:150px;">
            <button class="btn-elimina" data-id="${libro.id}">❌ Elimina</button>
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
    });
}

console.log("Script admin semplice caricato");