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

const libriDiv = document.getElementById("libri");
const infoContainer = document.getElementById("info-container");

function mostraLibri() {
  const libriRef = firebase.database().ref('libri');
  libriRef.on('value', (snapshot) => {
    const libri = snapshot.val();
    libriDiv.innerHTML = "";

    if (libri) {
      Object.values(libri).forEach((libro, index) => {
        const libroDiv = document.createElement("div");
        libroDiv.classList.add("section-libro");

        const immagine = document.createElement("img");
        immagine.src = libro.immagine;
        immagine.alt = libro.titolo;

        const titolo = document.createElement("h3");
        titolo.textContent = libro.titolo;

        const autore = document.createElement("p");
        autore.textContent = "di " + libro.autore;

        const prezzo = document.createElement("p");
        prezzo.innerHTML = "<b>" + libro.valuta + libro.prezzo + "</b>";

        const buyButton = document.createElement("button");
        buyButton.classList.add("buy-now-button");
        buyButton.textContent = "Compra ora";
        buyButton.addEventListener("click", function() {
          window.open(libro.linkAmazon, "_blank");
        });

        libroDiv.appendChild(immagine);
        libroDiv.appendChild(titolo);
        libroDiv.appendChild(autore);
        libroDiv.appendChild(prezzo);
        libroDiv.appendChild(buyButton);

        libroDiv.addEventListener("click", function() {
          mostraInfoLibro(index);
        });

        libriDiv.appendChild(libroDiv);
      });
    }
  });
}

function mostraInfoLibro(index) {
  const libriRef = firebase.database().ref('libri');
  libriRef.on('value', (snapshot) => {
    const libri = snapshot.val();
    const libro = Object.values(libri)[index];

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("info-libro");

    const closeButton = document.createElement("span");
    closeButton.classList.add("close-button");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", function() {
      infoContainer.innerHTML = "";
    });

    const immagine = document.createElement("img");
    immagine.src = libro.immagine;
    immagine.alt = libro.titolo;

    const info = document.createElement("div");

    const titolo = document.createElement("h3");
    titolo.textContent = libro.titolo;

    const autore = document.createElement("p");
    autore.textContent = "di " + libro.autore;

    const descrizione = document.createElement("p");
    descrizione.textContent = libro.descrizione;

    const prezzo = document.createElement("p");
    prezzo.innerHTML = "<b>" + libro.valuta + libro.prezzo + "</b>";

    const formati = document.createElement("p");
    formati.textContent = "Formati disponibili: " + libro.formati.join(", ");

    const buyButton = document.createElement("button");
    buyButton.classList.add("buy-now-button");
    buyButton.textContent = "Compra ora";
    buyButton.addEventListener("click", function() {
      window.open(libro.linkAmazon, "_blank");
    });

    info.appendChild(titolo);
    info.appendChild(autore);
    info.appendChild(descrizione);
    info.appendChild(prezzo);
    info.appendChild(formati);
    info.appendChild(buyButton);

    infoDiv.appendChild(closeButton);
    infoDiv.appendChild(immagine);
    infoDiv.appendChild(info);

    infoContainer.innerHTML = "";
    infoContainer.appendChild(infoDiv);
  });
}

function mostraLogo() {
  const logo = localStorage.getItem("logo");
  if (logo) {
    document.getElementById("logo-catalogo").src = logo;
  }
}

function mostraBanner() {
  const banner = localStorage.getItem("banner");
  if (banner) {
    document.getElementById("banner-catalogo").src = banner;
  }
}

mostraLibri();
mostraLogo();
mostraBanner();