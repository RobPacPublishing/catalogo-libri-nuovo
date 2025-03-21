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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

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
    document.getElementById(id).disabled = true;
    document.querySelector(`label[for="${id}"]`).style.display = "none";
});

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

loginButton.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            alert(`Benvenuto ${result.user.displayName}!`);
            setTimeout(() => location.reload(), 1000);
        })
        .catch(error => alert("Errore di autenticazione: " + error.message));
});

logoutButton.addEventListener("click", () => {
    firebase.auth().signOut()
        .then(() => {
            alert("Logout effettuato con successo!");
            location.reload();
        })
        .catch(error => alert("Errore nel logout"));
});

function caricaLibri() {
    firebase.database().ref('libri').once('value').then(snapshot => {
        cacheLibri = snapshot.val() ? Object.entries(snapshot.val()).map(([id, libro]) => ({ id, ...libro })) : [];
        mostraLibriInseriti();
    }).catch(error => alert("Errore nel caricamento dei libri: " + error.message));
}

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

    // 🔁 CONTROLLO DOPPIONE PER LINK AMAZON
    const snapshot = await firebase.database().ref("libri").once("value");
    const libri = snapshot.val();
    const linkEsistente = Object.values(libri || {}).some(libro => libro.linkAmazon === linkAmazon);
    if (linkEsistente) {
        mostraNotifica("🚫 Questo libro è già stato inserito (link Amazon duplicato)", "errore");
        return;
    }

    let urlImmagine = "placeholder.jpg";
    if (immagine) {
        urlImmagine = await uploadImmagine(immagine);
        if (!urlImmagine) return;
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
        mostraNotifica("📚 Libro aggiunto con successo!");
        libroForm.reset();
    }).catch(error => {
        mostraNotifica("❌ Errore durante l'aggiunta del libro: " + error.message, "errore");
    });
});

function mostraLibriInseriti() {
    libriInseriti.innerHTML = "";

    let libriFiltrati = [...cacheLibri];
    const testoFiltro = filtroTesto.value.toLowerCase();
    if (testoFiltro) {
        libriFiltrati = libriFiltrati.filter(libro =>
            libro.titolo.toLowerCase().includes(testoFiltro) ||
            libro.autore.toLowerCase().includes(testoFiltro)
        );
    }

    const criterio = ordinamento.value;
    libriFiltrati.sort((a, b) => {
        if (criterio === "prezzo") return parseFloat(a.prezzo) - parseFloat(b.prezzo);
        return a[criterio].localeCompare(b[criterio]);
    });

    libriFiltrati.forEach(libro => {
        const div = document.createElement("div");
        div.className = "admin-libro";
        div.innerHTML = `
            <h3>${libro.titolo}</h3>
            <p>Autore: ${libro.autore}</p>
            <p>Prezzo: ${libro.valuta} ${libro.prezzo}</p>
            <img src="${libro.immagine}" alt="${libro.titolo}" style="width:100px; height:150px;">
            <button onclick="eliminaLibro('${libro.id}')">❌ Elimina</button>
        `;
        libriInseriti.appendChild(div);
    });
}

if (filtroTesto) filtroTesto.addEventListener("input", mostraLibriInseriti);
if (ordinamento) ordinamento.addEventListener("change", mostraLibriInseriti);