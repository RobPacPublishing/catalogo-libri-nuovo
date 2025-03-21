// Configurazione Firebase
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

// Amministratori autorizzati
const amministratoriAutorizzati = ["robpacpublishing@gmail.com"];

// Autenticazione
firebase.auth().onAuthStateChanged(user => {
    console.log("Stato autenticazione cambiato", user ? user.email : "nessun utente");
    if (user && amministratoriAutorizzati.includes(user.email)) {
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
    } else {
        loginContainer.style.display = "block";
        adminPanel.style.display = "none";
        firebase.auth().signOut();
    }
});

// Login
if (loginButton) {
    loginButton.addEventListener("click", () => {
        console.log("Tentativo di login");
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                alert(`Benvenuto ${result.user.displayName}!`);
                setTimeout(() => location.reload(), 1000);
            })
            .catch(error => alert("Errore di autenticazione: " + error.message));
    });
}

// Logout
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        console.log("Tentativo di logout");
        firebase.auth().signOut()
            .then(() => {
                alert("Logout effettuato con successo!");
                location.reload();
            })
            .catch(error => alert("Errore nel logout"));
    });
}

console.log("Script di admin minimale caricato");