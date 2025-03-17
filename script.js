const libriSection = document.getElementById("libri");
const infoContainer = document.getElementById("info-container");
const logoCatalogo = document.getElementById("logo-catalogo");
const bannerCatalogo = document.getElementById("banner-catalogo");

function recuperaLibri() {
    return JSON.parse(localStorage.getItem("libri")) || [];
}

const libri = recuperaLibri();

libri.forEach((libro) => {
    const libroDiv = document.createElement("div");
    libroDiv.classList.add("section-libro");

    const immagine = document.createElement("img");
    immagine.src = libro.immagine;
    immagine.alt = libro.titolo;

    const titolo = document.createElement("h3");
    titolo.textContent = libro.titolo;

    const autore = document.createElement("p");
    autore.innerHTML = `<b>${libro.autore}</b>`;

    const buyNowButton = document.createElement("a");
    buyNowButton.href = libro.linkAmazon;
    buyNowButton.textContent = "Buy Now";
    buyNowButton.classList.add("buy-now-button");

    const priceFrom = document.createElement("p");
    priceFrom.innerHTML = `Price from: ${libro.valuta}<b>${libro.prezzo}</b>`;

    const infoButton = document.createElement("button");
    infoButton.textContent = "Info";
    infoButton.addEventListener("click", function() {
        mostraInfoLibro(libro);
    });

    libroDiv.appendChild(immagine);
    libroDiv.appendChild(titolo);
    libroDiv.appendChild(autore);
    libroDiv.appendChild(priceFrom);
    libroDiv.appendChild(buyNowButton);
    libroDiv.appendChild(infoButton);

    libriSection.appendChild(libroDiv);
});

function mostraInfoLibro(libro) {
    infoContainer.innerHTML = "";
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

    const titolo = document.createElement("h3");
    titolo.textContent = libro.titolo;

    const autore = document.createElement("p");
    autore.innerHTML = `<b>${libro.autore}</b>`;

    const descrizione = document.createElement("p");
    descrizione.textContent = libro.descrizione;

    const formati = document.createElement("p");
    formati.textContent = `Formats and editions: ${libro.formati.join(", ")}`;

    const buyNowButton = document.createElement("a");
    buyNowButton.href = libro.linkAmazon;
    buyNowButton.textContent = "Buy Now";
    buyNowButton.classList.add("buy-now-button");

    const priceFrom = document.createElement("p");
    priceFrom.innerHTML = `Price from: ${libro.valuta}<b>${libro.prezzo}</b>`;

    const infoContent = document.createElement("div");
    infoContent.appendChild(titolo);
    infoContent.appendChild(autore);
    infoContent.appendChild(descrizione);
    infoContent.appendChild(formati);
    infoContent.appendChild(priceFrom);
    infoContent.appendChild(buyNowButton);

    infoDiv.appendChild(closeButton);
    infoDiv.appendChild(immagine);
    infoDiv.appendChild(infoContent);

    infoContainer.appendChild(infoDiv);
}

logoCatalogo.src = "logo3senzasfondo.png";
bannerCatalogo.src = "banner landpage2.png";