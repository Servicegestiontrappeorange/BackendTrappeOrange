//const { ObjectId } = require("");
const { ObjectId } = require('mongodb');
const client = require("../db/connect");
const Technicien = require("../models/techniciens");
const sgMail = require('@sendgrid/mail');
const mqtt = require('mqtt');
const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();
API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(API_KEY);

//const nodemailer = require('nodemailer');


const CreateTechnicien = async (req, res) => {
    try {
        const { identifiant, prenom, nom, email } = req.body;
        const login = `${prenom.toLowerCase()}${nom.toLowerCase()}${Math.floor(Math.random() * 100)}`;
        const plainPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(plainPassword, 5);

        // Créez un nouvel objet Technicien avec les champs requis
        const technicien = {
            identifiant,
            prenom,
            nom,
            email,
            login,
            motdepasse: hashedPassword,
            //motifIntervention,
            //numeroTrappe,
        };

        const msg = {
            to: email,
            from: 'servicegestiontechnicien@gmail.com',
            subject: 'Informations de connexion',
            text: `Voici vos informations de connexion pour l'application Trappe Orange  :\n\nLogin: ${login}\nMot de passe: ${plainPassword}`,
        };

        await sgMail.send(msg);

        // Insérez dans la base de données une fois l'e-mail envoyé avec succès
        const result = await client.db().collection("techniciens").insertOne(technicien);

        res.status(200).json({ message: 'E-mail envoyé avec succès et utilisateur créé', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'e-mail ou création du technicien' });
    }
};


const getTechniciens = async (req, res) => {
    try {
        const cursor = client
            .db()
            .collection("techniciens")
            .find()
            .sort({ prenom: 1 });

        const result = await cursor.toArray();
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des techniciens' });
    }
};

const getTechnicien = async (req, res) => {
    try {
        let id = req.params.id; // Récupérez directement l'ID fourni dans les paramètres de la requête
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "L'ID n'est pas au bon format" });
        }

        let cursor = client.db().collection('techniciens').find({ _id: new ObjectId(id) });
        let result = await cursor.toArray();

        if (result.length > 0) {
            res.status(200).json(result[0]);
        } else {
            res.status(204).json({ msg: "Cet utilisateur n'existe pas" });
        }
    } catch (error) {
        console.log(error);
        res.status(501).json(error);
    }
};

const UpdateTechnicien = async (req, res) => {
    try {
        let id = new ObjectId(req.params.id);
        let identifiant = req.body.identifiant;
        let prenom = req.body.prenom;
        let nom = req.body.nom;
        let email = req.body.email;



        let result = await client
            .db()
            .collection('techniciens')
            .updateOne({ _id: id }, { $set: { identifiant, prenom, nom, email } });

        if (result.modifiedCount === 1) {
            res.status(200).json({ msg: 'Update succefuly' })
        } else {
            res.status(404).json({ msg: "Ce technicien n'existe pas" })
        }

    } catch (error) {
        console.log(error)
        res.status(501).json({ msg: 'Erreur lors de la modification' })

    }
}



const DeleteTechnicien = async (req, res) => {
    try {
        const id = req.params.id;

        // Vérifiez si l'ID est valide avant de continuer
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "L'ID n'est pas valide" });
        }

        let _id = new ObjectId(id);
        let result = await client
            .db()
            .collection('techniciens')
            .deleteOne({ _id: _id });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Suppression réussie' });
        } else {
            res.status(404).json({ message: "Ce technicien n'existe pas" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression du technicien' });
    }
};
const jwt = require('jsonwebtoken');
const secretkey = 'GestionTechnicien1234567';

const authenticateTechnicien = async (req, res) => {
    try {
        const { login, motdepasse } = req.body;
        // récupérer le technicien par son login
        const technicien = await client
            .db()
            .collection('techniciens')
            .findOne({ login });

        if (!technicien) {
            return res.status(404).json({ error: 'Identifiant ou mot de passe  incorrect' });
        }
        // Comparez le mot de passe en clair avec le mot de passe haché
        const isPasswordValid = await bcrypt.compare(motdepasse, technicien.motdepasse);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Login ou mot de passe incorrect' });
        }

        // Génération du token JWt
        const token = jwt.sign({ id: technicien._id, login: technicien.login }, secretkey, { expiresIn: '1h' });

        // Authentification réussie
        res.status(200).json({ message: 'Authentification réussie', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'authentification' });
    }
};
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'Token requis' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token invalide' });
        }
        req.technicienId = decoded.id;
        next();
    });
};

//  Push des données vers MQTT 
// On  echange d'abord le premier message qui est CONNECT avec MQTT et on verifie si il y a une connection en cours
const checkMQTTConnection = async (brokerUrl, clientId, username, password) => {
    return new Promise((resolve) => {
        const client = mqtt.connect(brokerUrl, { clientId, username, password });

        client.on('connect', () => {
            client.end();
            resolve(true);
        });

        client.on('error', () => {
            client.end();
            resolve(false);
        });
    });
};
// on push les données vers MQTT 
const publishAdditionalData = async (login, motifIntervention, numeroTrappe, adress) => {
    try {
        const brokeUrl = 'mqtts://mqtt.liveobjects.orange-business.com:8883';
        const clientId = 'urn:lo:nsid:mqtt:DetailsID';
        const username = 'json+device';
        const password = process.env.MQTT_SECRET_KEY;

        // Verifier la connexion MQTT
        const isConnected = await checkMQTTConnection(brokeUrl, clientId, username, password);
        if (isConnected) {
            const client = mqtt.connect(brokeUrl, { clientId, username, password });
            client.on('connect', () => {
                console.log('Connecté à Live Objects via MQTT');

                const addionalData = {
                    value: {
                        login,
                        motifIntervention,
                        numeroTrappe,
                        adress
                    }
                };
                const jsonMessage = JSON.stringify(addionalData);
                console.log('JSON Message:', jsonMessage);
                // Convertir la chaîne JSON en tampon encodé en UTF-8


                // Publier le message via mqtt sur le topic dev/data
                client.publish('dev/data', jsonMessage, (err) => {
                    if (err) {
                        console.error('Erreur lors de la publication MQTT', err);
                    } else {
                        console.log('Donnees supplementaires envoyees avec succes via MQTT a live object');
                    }
                    client.end();
                });
            });
        }
    } catch (error) {
        console.error('Erreur lors de la publication des donnees supplementaires via MQTT', error);
    }
};


const enregistrerDetails = async (req, res) => {
    try {
        console.log('Requête de mise à jour des détails reçue');
        const { id } = req.params; // ID du technicien à mettre à jour
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID invalide' });
        }
        const { motifIntervention, numeroTrappe, address } = req.body; // Données à mettre à jour
        if (!motifIntervention || !numeroTrappe || !address) {
            return res.status(400).json({ message: 'Données motifIntervention ou numeroTrappe manquantes ou localisation' });
        }
        // publier les details via MQTT vers LIVE OBJECT
        const technicien = await client
            .db()
            .collection('techniciens')
            .findOne({ _id: new ObjectId(id) });

        if (!technicien) {
            return res.status(404).json({ message: "Ce technicien n'existe pas" });
        }

        await publishAdditionalData(technicien.login, motifIntervention, numeroTrappe, address);

        const result = await client
            .db()
            .collection('techniciens')
            .updateOne(
                { _id: new ObjectId(id) }, // Utilisation de l'ID reçu dans la requête
                { $set: { motifIntervention, numeroTrappe, address } } // Mise à jour des champs
            );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Détails enregistrés avec succès !' });
        } else {
            res.status(404).json({ message: "Ce technicien n'existe pas ou les détails n'ont pas été modifiés." });
        }

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des détails:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement des détails. Veuillez réessayer.' });
    }
};

const getTechnicienByLogin = async (req, res) => {
    try {
        const { login } = req.params;
        console.log('Recherche du technicien par login:', login);



        // Recherche du technicien par le login
        const technicien = await client
            .db()
            .collection('techniciens')
            .findOne({ login });

        if (!technicien) {
            return res.status(404).json({ error: 'Technicien non trouvé' });
        }

        // Utilisation de l'ID de l'objet MongoDB pour le technicien trouvé
        const technicienId = technicien._id;

        res.status(200).json({ technicienId: technicien._id });
    } catch (error) {
        console.error('Erreur lors de la récupération du technicien par login :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du technicien' });
    }

};

// Fonction mise à jour pour obtenir tous les détails d'un technicien par login
const getTechnicienDetailsByLogin = async (req, res) => {
    try {
        const { login } = req.params;
        console.log('Recherche du technicien par login:', login);

        const technicien = await client
            .db()
            .collection('techniciens')
            .findOne({ login });
        if (!technicien) {
            return res.status(404).json({ message: 'Technicien non trouvé' })
        }
        // envoie des données du techniciens sans mot de passe pour  des raison de sécurité
        const { motdepasse, ...technicienDetails } = technicien;
        res.status(200).json(technicienDetails);
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Erreur lors de la récuperation du technicien' });
    }
}

module.exports = {
    CreateTechnicien,
    getTechniciens,
    getTechnicien,
    UpdateTechnicien,
    DeleteTechnicien,
    authenticateTechnicien,
    enregistrerDetails,
    getTechnicienByLogin,
    getTechnicienDetailsByLogin,
    verifyToken

}
