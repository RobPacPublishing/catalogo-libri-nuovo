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

// INIZIALIZZAZIONE FIREBASE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// LISTA AMMINISTRATORI AUTORIZZATI
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// ELEMENTI HTML
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const libroForm = document.getElementById("libro-form");
const libriInseriti = document.getElementById("libri-inseriti");
const filtroTesto = document.getElementById("filtro-testo");
const ordinamento = document.getElementById("ordinamento");

// CACHE LOCALE
let cacheLibri = [];

// NOTIFICHE
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

// CONTROLLO ACCESSO AMMINISTRATORI
firebase.auth().onAuthStateChanged(user => {
    if (user && amministratoriAutorizzati.includes(user.email)) {
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
        caricaLibri();
    } else {
        loginContainer.style.display = "block";
        adminPanel.style.display = "none";
        mostraNotifica("⚠️ Accesso negato o utente non autenticato!", "errore");
        firebase.auth().signOut();
    }
});

// LOGIN CON GOOGLE
loginButton.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            mostraNotifica(`Benvenuto ${result.user.displayName}!`, "successo");
            setTimeout(() => { location.reload(); }, 1000);
        })
        .catch(error => mostraNotifica("Errore di autenticazione: " + error.message, "errore"));
});

// LOGOUT
logoutButton.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        mostraNotifica("Logout effettuato con successo!", "successo");
        location.reload();
    }).catch(error => mostraNotifica("Errore nel logout", "errore"));
});

// CARICAMENTO LIBRI
function caricaLibri() {
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        mostraLibriInseriti();
    }).catch(error => mostraNotifica("Errore nel caricamento dei libri: " + error.message, "errore"));
}

// FUNZIONE UPLOAD CLOUDINARY
async function uploadImmagine(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "robpac_upload");
    formData.append("folder", "copertine");

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/robpac/image/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error(`Errore nell'upload: ${response.statusText}`);
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        mostraNotifica("Errore nel caricamento dell'immagine: " + error.message, "errore");
        return null;
    }
}

// INSERIMENTO NUOVO LIBRO
libroForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const titolo = document.getElementById("titolo").value.trim();
    const autore = document.getElementById("autore").value.trim();
    const descrizione = document.getElementById("descrizione").value.trim();
    const linkAmazon = document.getElementById("linkAmazon").value.trim();
    const immagine = document.getElementById("immagine").files[0];
    const prezzo = parseFloat(document.getElementById("prezzo").value.replace(",", "."));
    const valuta = document.getElementById("valuta").value;
    const formati = Array.from(document.querySelectorAll('input[name="formati"]:checked')).map(checkbox => checkbox.value);

    if (!titolo || !autore || !descrizione || !linkAmazon || isNaN(prezzo)) {
        return mostraNotifica("⚠️ Tutti i campi devono essere compilati!", "errore");
    }

    let urlImmagine = "placeholder.jpg";
    if (immagine) {
        urlImmagine = await uploadImmagine(immagine);
        if (!urlImmagine) return;
    }

    const libro = { titolo, autore, descrizione, linkAmazon, prezzo: prezzo.toFixed(2), valuta, immagine: urlImmagine, formati };
    const libriRef = firebase.database().ref('libri').push();
    libro.id = libriRef.key;
    libriRef.set(libro).then(() => {
        cacheLibri.push(libro);
        mostraLibriInseriti();
        mostraNotifica("📚 Libro aggiunto con successo!", "successo");
        libroForm.reset();
    }).catch(error => mostraNotifica("Errore durante l'aggiunta del libro: " + error.message, "errore"));
});

// MOSTRA LIBRI INSERITI SOLO NEL LATO ADMIN
function mostraLibriInseriti() {
    libriInseriti.innerHTML = "";

    // Applica il filtro testo se presente
    let libriFiltrati = cacheLibri;
    if (filtroTesto.value.trim() !== "") {
        const filtro = filtroTesto.value.trim().toLowerCase();
        libriFiltrati = libriFiltrati.filter(libro =>
            libro.titolo.toLowerCase().includes(filtro) ||
            libro.autore.toLowerCase().includes(filtro) ||
            libro.descrizione.toLowerCase().includes(filtro)
        );
    }

    // Applica l'ordinamento se selezionato
    if (ordinamento.value === "titolo") {
        libriFiltrati.sort((a, b) => a.titolo.localeCompare(b.titolo));
    } else if (ordinamento.value === "autore") {
        libriFiltrati.sort((a, b) => a.autore.localeCompare(b.autore));
    } else if (ordinamento.value === "prezzo") {
        libriFiltrati.sort((a, b) => parseFloat(a.prezzo) - parseFloat(b.prezzo));
    }

    // Visualizza i libri filtrati e ordinati
    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.classList.add("admin-libro");
        div.dataset.id = libro.id;
        div.innerHTML = `
            <h3>${libro.titolo}</h3>
            <p>Autore: ${libro.autore}</p>
            <p>Prezzo: ${libro.valuta} ${libro.prezzo}</p>
            <img src="${libro.immagine}" alt="${libro.titolo}" style="width:100px; height:150px;">
            <p>Descrizione: ${libro.descrizione}</p>
            <p>Formati: ${libro.formati && libro.formati.length > 0 ? libro.formati.join(", ") : "Nessun formato specificato"}</p>
            <button onclick="eliminaLibro('${libro.id}')">❌ Elimina</button>
        `;
        libriInseriti.appendChild(div);
    });
}

// ELIMINA LIBRO
function eliminaLibro(libroId) {
    firebase.database().ref('libri/' + libroId).remove()
        .then(() => {
            cacheLibri = cacheLibri.filter(libro => libro.id !== libroId);
            mostraLibriInseriti();
            mostraNotifica("Libro eliminato con successo!", "successo");
        })
        .catch(error => mostraNotifica("Errore nell'eliminazione del libro: " + error.message, "errore"));
}

// EVENTI FILTRO E ORDINAMENTO
if (filtroTesto) filtroTesto.addEventListener("input", mostraLibriInseriti);
if (ordinamento) ordinamento.addEventListener("change", mostraLibriInseriti);