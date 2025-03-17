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
    fetch("libri.json")
        .then(response => response.json())
        .then(libri => {
            libri.push(libro);
            return fetch("libri.json", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
body: JSON.stringify(libri)
            });
        });
}

function modificaLibroInFile(index, libroModificato) {
    fetch("libri.json")
        .then(response => response.json())
        .then(libri => {
            libri[index] = libroModificato;
            return fetch("libri.json", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(libri)
            });
        });
}

function mostraLibriInseriti() {
    libriInseriti.innerHTML = "";
    fetch("libri.json")
        .then(response => response.json())
        .then(libri => {
            libri.forEach((libro, index) => {
                const libroDiv = document.createElement("div");
                libroDiv.classList.add("admin-libro");

                const immagine = document.createElement("img");
                immagine.src = libro.immagine;
                immagine.alt = libro.titolo;

                const titolo = document.createElement("h3");
                titolo.textContent = libro.titolo;

                const modificaButton = document.createElement("button");
                modificaButton.textContent = "Modifica";
                modificaButton.addEventListener("click", function() {
                    modificaLibro(index);
                });

                const cancellaButton = document.createElement("button");
                cancellaButton.textContent = "Cancella";
                cancellaButton.addEventListener("click", function() {
                    cancellaLibro(index);
                });

                libroDiv.appendChild(immagine);
                libroDiv.appendChild(titolo);
                libroDiv.appendChild(modificaButton);
                libroDiv.appendChild(cancellaButton);

                libriInseriti.appendChild(libroDiv);
            });
        });
}

function modificaLibro(index) {
    fetch("libri.json")
        .then(response => response.json())
        .then(libri => {
            const libro = libri[index];

            document.getElementById("titolo").value = libro.titolo;
            document.getElementById("autore").value = libro.autore;
            document.getElementById("descrizione").value = libro.descrizione;
            document.getElementById("linkAmazon").value = libro.linkAmazon;
            document.getElementById("prezzo").value = libro.prezzo;
            document.getElementById("valuta").value = libro.valuta;
            document.getElementById("formati").value = libro.formati;

            libroDaModificare = index;
            libroForm.querySelector("button").textContent = "Modifica libro";
        });
}

function cancellaLibro(index) {
    fetch("libri.json")
        .then(response => response.json())
        .then(libri => {
            libri.splice(index, 1);
            return fetch("libri.json", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(libri)
            });
        })
        .then(() => mostraLibriInseriti());
}

mostraLibriInseriti();

personalizzazioneForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const logo = document.getElementById("logo").files[0];
    const banner = document.getElementById("banner").files[0];

    if (logo) {
        const readerLogo = new FileReader();
        readerLogo.onload = function(event) {
            localStorage.setItem("logo", event.target.result);
            alert("Logo personalizzato");
        };
        readerLogo.readAsDataURL(logo);
    }

    if (banner) {
        const readerBanner = new FileReader();
        readerBanner.onload = function(event) {
            localStorage.setItem("banner", event.target.result);
            alert("Banner personalizzato");
        };
        readerBanner.readAsDataURL(banner);
    }
});