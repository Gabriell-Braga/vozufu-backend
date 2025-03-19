const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

// Inicializa o Firebase
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// Função para verificar o token de autenticação
const verifyToken = async (token) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        throw new Error("Token inválido ou expirado");
    }
};

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

// Rota para listar todas as denúncias
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

// Rota para pegar as denúncias de um usuário logado
app.get("/denuncias/usuario", async (req, res) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    if (!token) {
        return res.status(400).send({ error: "Token de autenticação não fornecido" });
    }

    try {
        const decodedToken = await verifyToken(token);
        const usuario = decodedToken.uid;

        const snapshot = await db.collection("denuncias").where("usuario", "==", usuario).get();
        let denuncias = [];
        snapshot.forEach(doc => {
            denuncias.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(denuncias);
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar denúncias do usuário" });
    }
});

// Rota para pegar uma denúncia específica por ID
app.get("/denuncias/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const doc = await db.collection("denuncias").doc(id).get();

        if (!doc.exists) {
            return res.status(404).send({ error: "Denúncia não encontrada" });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar a denúncia" });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
