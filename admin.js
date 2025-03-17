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

  const titolo = document.getElementById("titolo").value;
  const autore = document.getElementById("autore").value;
  const descrizione = document.getElementById("descrizione").value;
  const linkAmazon = document.getElementById("linkAmazon").value;
  let immagine = null;
  if (document.getElementById("immagine").files[0]) {
    immagine = document.getElementById("immagine").files[0];
  }
  const prezzo = document.getElementById("prezzo").value;
  const valuta = document.getElementById("valuta").value;
  const formati = [];
  if (document.getElementById("ebook").checked) {
    formati.push("eBook");
  }
  if (document.getElementById("paperback").checked) {
    formati.push("Paperback");
  }
  if (document.getElementById("hardcover").checked) {
    formati.push("Hardcover");
  }

  if (immagine) {
    const reader = new FileReader();

    reader.onload = function(event) {
      const immagineBase64 = event.target.result;

      const libro = {
        titolo: titolo,
        autore: autore,
        descrizione: descrizione,
        linkAmazon: linkAmazon,
        immagine: immagineBase64,
        prezzo: prezzo,
        valuta: valuta,
        formati: formati,
      };

      if (libroDaModificare !== null) {
        modificaLibroInFile(libroDaModificare, libro);
        libroDaModificare = null;
        libroForm.querySelector("button").textContent = "Aggiungi libro";
      } else {
        aggiungiLibroAlFile(libro);
      }

      mostraLibriInseriti();
      libroForm.reset();
    };

    reader.readAsDataURL(immagine);
  } else {
    const libro = {
      titolo: titolo,
      autore: autore,
      descrizione: descrizione,
      linkAmazon: linkAmazon,
      prezzo: prezzo,
      valuta: valuta,
      formati: formati,
    };

    if (libroDaModificare !== null) {
      modificaLibroInFile(libroDaModificare, libro);
      libroDaModificare = null;
      libroForm.querySelector("button").textContent = "Aggiungi libro";
    } else {
      aggiungiLibroAlFile(libro);
    }

    mostraLibriInseriti();
    libroForm.reset();
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
  // ... (codice per visualizzare i libri inseriti) ...
}

function modificaLibroInFile(libroDaModificare, libro) {
  // ... (codice per modificare un libro esistente) ...
}