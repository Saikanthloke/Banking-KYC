const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Database
const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// Create tables
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    dob TEXT,
    address TEXT,
    idProof TEXT,
    kycStatus TEXT DEFAULT 'Not Started'
)
`);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) {
            res.redirect("/kyc?user=" + row.username);
        } else {
            res.send("Invalid login. <a href='/'>Try again</a>");
        }
    });
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) {
            res.send("Username already exists. <a href='/'>Try again</a>");
        } else {
            res.redirect("/kyc?user=" + username);
        }
    });
});

app.get("/kyc", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "kyc.html"));
});

app.post("/submit-kyc", (req, res) => {
    const { username, fullName, dob, address, idProof } = req.body;
    db.run(
        "UPDATE users SET fullName=?, dob=?, address=?, idProof=?, kycStatus=? WHERE username=?",
        [fullName, dob, address, idProof, "Verification in Progress", username],
        function(err) {
            if (err) console.error(err);
            res.redirect("/status?user=" + username);
        }
    );
});

app.get("/status", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "status.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
