const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

// Inicializa o Firebase
const serviceAccount = require("./firebase-key.json"); // Arquivo da chave privada
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// Rota para enviar uma denúncia
app.post("/denuncias", async (req, res) => {
    try {
        const { descricao, local, anonimo, usuario } = req.body;
        await db.collection("denuncias").add({
            descricao,
            local,
            anonimo,
            usuario: anonimo ? "Anônimo" : usuario,
            data: new Date()
        });
        res.status(201).send({ message: "Denúncia enviada com sucesso!" });
    } catch (error) {
        res.status(500).send({ error: "Erro ao enviar denúncia" });
    }
});

// Rota para listar denúncias
app.get("/denuncias", async (req, res) => {
    try {
        const snapshot = await db.collection("denuncias").get();
        let denuncias = [];
        snapshot.forEach(doc => {
            denuncias.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(denuncias);
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar denúncias" });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
