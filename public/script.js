// Funzione per mostrare le informazioni del libro nel popup
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;

        popupImage.src = libro.immagine || "placeholder.jpg";
        popupImage.alt = libro.titolo;
        popupTitle.textContent = libro.titolo || "Title not available";
        popupAuthor.textContent = libro.autore ? `by ${libro.autore}` : "Unknown author";
        popupDescription.textContent = libro.descrizione || "No description available.";

        if (libro.valuta && libro.prezzo) {
            popupPrice.innerHTML = `<b>from ${libro.valuta}${libro.prezzo}</b>`;
        } else {
            popupPrice.innerHTML = "";
        }

        popupFormats.style.display = "none"; 

        if (libro.linkAmazon) {
            popupBuyNow.style.display = "block";
            popupBuyNow.onclick = () => window.open(libro.linkAmazon, "_blank");
        } else {
            popupBuyNow.style.display = "none";
        }

        popupContainer.style.display = "block";  // Mostra il popup
    }).catch(error => {
        console.error("Error retrieving book details:", error);
    });
}

// Chiude il popup
closePopup.addEventListener("click", () => {
    popupContainer.style.display = "none";
});


// Avvia il caricamento dei libri
mostraLibri();
mostraLogo();
mostraBanner();