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

// Amministratori autorizzati
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

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
    }).catch(error => {
        alert("Errore nel caricamento dei libri: " + error.message);
    });
}

// Upload immagine
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
            mostraNotifica("Errore nel caricamento dell'immagine", "errore");
            return null;
        }
        
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        mostraNotifica("Errore nel caricamento dell'immagine", "errore");
        return null;
    }
}

// Gestione form
if (libroForm) {
    libroForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
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
        const snapshot = await firebase.database().ref("libri")
            .orderByChild("linkAmazon")
            .equalTo(linkAmazon)
            .once("value");
            
        if (snapshot.exists()) {
            mostraNotifica("Questo libro è già stato inserito", "errore");
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

// Funzione per eliminare un libro
function eliminaLibro(id) {
    if (confirm("Sei sicuro di voler eliminare questo libro?")) {
        firebase.database().ref(`libri/${id}`).remove()
            .then(() => {
                cacheLibri = cacheLibri.filter(libro => libro.id !== id);
                mostraLibriInseriti();
                mostraNotifica("Libro eliminato con successo!");
            })
            .catch(error => {
                mostraNotifica("Errore durante l'eliminazione", "erro