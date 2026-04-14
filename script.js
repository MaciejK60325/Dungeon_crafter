const API_URL = "http://127.0.0.1:8000";

async function register() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    const mail = document.getElementById("mail").value;

    try {
        const res = await fetch(`${API_URL}/users/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password, mail })
        });
        const data = await res.json();
        console.log("Zarejestrowano:", data);
    } catch (err) {
        console.error(err);
    }
}

async function login() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/login/?login=${login}&password=${password}`, {
            method: "POST",
        });
        const data = await res.json();
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}