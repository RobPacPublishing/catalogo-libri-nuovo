const firebaseConfig = {
    apiKey: "AIzaSyAOIp2reVVoeikYjZUk73yQpZNPaDVvCkw",
    authDomain: "aggiungilibri.firebaseapp.com",
    databaseURL: "https://aggiungilibri-default-rtdb.firebaseio.com",
    projectId: "aggiungilibri",
    storageBucket: "aggiungilibri.firebasestorage.app",
    messagingSenderId: "215130413037",
    appId: "1:215130413037:web:058d3395ddef3b7441f9e4"
};

firebase.initializeApp(firebaseConfig);

const libroForm = document.getElementById("libro-form");
const libriInseriti = document.getElementById("libri-inseriti");
let libroDaModificare = null;
const personalizzazioneForm = document.getElementById("personalizzazione-form");

libroForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // ... (codice per la raccolta dei dati del libro) ...

    if (immagine) {
        // ... (codice per la gestione dell'immagine) ...
    } else {
        // ... (codice per l'aggiunta del libro senza immagine) ...
    }
});

function aggiungiLibroAlFile(libro) {
    const libriRef = firebase.database().ref('libri');
    libriRef.push(libro)
        .then(() => {
            mostraLibriInseriti();
        })
        .catch((error) => {
            console.error("Errore durante l'aggiunta del libro:", error);
        });
}

function mostraLibriInseriti() {
    const libriRef = firebase.database().ref('libri');
    libriRef.on('value', (snapshot) => {
        const libri = snapshot.val();
        libriInseriti.innerHTML = "";

        if (libri) {
            Object.values(libri).forEach((libro) => {
                const libroDiv = document.createElement("div");
                libroDiv.innerHTML = `
                    <h3>${libro.titolo}</h3>
                    <p>${libro.autore}</p>
                    <p>${libro.descrizione}</p>
                    <img src="${libro.immagine}" alt="${libro.titolo}" style="max-width: 100px;">
                `;
                libriInseriti.appendChild(libroDiv);
            });
        }
    });
}

function modificaLibroInFile(libroDaModificare, libro) {
    // ... (codice per modificare un libro esistente) ...
}