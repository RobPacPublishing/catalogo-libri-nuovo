
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOIp2reVVoeikYjZUk73yQpZNPaDVvCkw",
    authDomain: "aggiungilibri.firebaseapp.com",
    databaseURL: "https://aggiungilibri-default-rtdb.firebaseio.com",
    projectId: "aggiungilibri",
    storageBucket: "aggiungilibri.firebasestorage.app",
    messagingSenderId: "215130413037",
    appId: "1:215130413037:web:058d3395ddef3b7441f9e4"
};

// Initialize Firebase
if (!firebase.apps.length) {
    console.log("Firebase SDK loaded?", typeof firebase !== "undefined");
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Selectors for HTML elements
const libriDiv = document.getElementById("libri");
const popupContainer = document.getElementById("book-popup");
const popupImage = document.getElementById("popup-image");
const popupTitle = document.getElementById("popup-title");
const popupAuthor = document.getElementById("popup-author");
const popupDescription = document.getElementById("popup-description");
const popupFormats = document.getElementById("popup-formats");
const popupPrice = document.getElementById("popup-price");
const popupBuyNow = document.getElementById("popup-buy-now");
const closePopup = document.querySelector(".close-popup");

// Ensure required elements exist
if (!libriDiv) {
    console.error("Error: 'libri' element not found in index.html.");
}
if (!popupContainer) {
    console.error("Error: 'book-popup' element not found in index.html.");
}

// Function to display books in the catalog
function mostraLibri() {
    const libriRef = firebase.database().ref("libri");
    libriRef.once("value").then(snapshot => {
        const libri = snapshot.val();
        libriDiv.innerHTML = ""; // Clear the container before updating

        if (libri) {
            Object.entries(libri).forEach(([id, libro]) => {
                // Create book card
                const libroDiv = document.createElement("div");
                libroDiv.classList.add("section-libro");

                const immagine = document.createElement("img");
                immagine.src = libro.immagine || "placeholder.jpg";
                immagine.alt = libro.titolo;
                immagine.classList.add("img-libro");

                const titolo = document.createElement("h3");
                titolo.textContent = libro.titolo || "Title not available";

                const autore = document.createElement("p");
                autore.textContent = libro.autore ? "by " + libro.autore : "Unknown author";

                const prezzo = document.createElement("p");
                prezzo.innerHTML = libro.valuta && libro.prezzo ? `<b>from ${libro.valuta}${libro.prezzo}</b>` : "Price not available";

                const buyButton = document.createElement("button");
                buyButton.classList.add("buy-now-button");
                buyButton.textContent = "Buy now";
                if (libro.linkAmazon) {
                    buyButton.addEventListener("click", () => {
                        window.open(libro.linkAmazon, "_blank");
                    });
                } else {
                    buyButton.disabled = true;
                }

                // Add elements to the book card
                libroDiv.appendChild(immagine);
                libroDiv.appendChild(titolo);
                libroDiv.appendChild(autore);
                libroDiv.appendChild(prezzo);
                libroDiv.appendChild(buyButton);

                // Add event to open the popup
                libroDiv.addEventListener("click", () => mostraInfoLibro(id));

                // Append book to catalog
                libriDiv.appendChild(libroDiv);
            });
        } else {
            libriDiv.innerHTML = "<p>No books available.</p>";
        }
    }).catch(error => {
        console.error("Error fetching books:", error);
    });
}

// Function to show book details in a popup
function mostraInfoLibro(libroId) {
    const libriRef = firebase.database().ref(`libri/${libroId}`);
    libriRef.once("value").then(snapshot => {
        const libro = snapshot.val();
        if (!libro) return;

        // Update popup content
        popupImage.src = libro.immagine || "placeholder.jpg";
        popupImage.alt = libro.titolo;
        popupTitle.textContent = libro.titolo || "Title not available";
        popupAuthor.textContent = libro.autore ? "by " + libro.autore : "Unknown author";
        popupDescription.textContent = libro.descrizione || "No description available.";
        popupFormats.textContent = libro.formati ? "Available formats: " + libro.formati.join(", ") : "N/A";
        popupPrice.innerHTML = libro.valuta && libro.prezzo ? `<b>from ${libro.valuta}${libro.prezzo}</b>` : "Price not available";

        if (libro.linkAmazon) {
            popupBuyNow.style.display = "block";
            popupBuyNow.onclick = () => window.open(libro.linkAmazon, "_blank");
        } else {
            popupBuyNow.style.display = "none";
        }

        // Show the popup
        popupContainer.style.display = "flex";
    }).catch(error => {
        console.error("Error fetching book details:", error);
    });
}

// Close the popup
closePopup.addEventListener("click", () => {
    popupContainer.style.display = "none";
});

// Load logo and banner
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

// Initialize content
mostraLibri();
mostraLogo();
mostraBanner();
