const mqtt = require('mqtt');
const sgMail = require('@sendgrid/mail');
const MqttData = require('../models/Mqttdata');
require('dotenv').config

const clientId = 'urn:lo:nsid:mqtt:AVoirData';
const password = process.env.MQTT_SECRET_KEY1;
const username = 'application';
const fifoDevice = 'DevicesTrappe';
const fifoTechnician = 'TrappeOrange';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

let isSubscribed = false;

sgMail.setApiKey(SENDGRID_API_KEY);

const mqttClient = () => {
    const mqttClient = mqtt.connect('mqtts://liveobjects.orange-business.com:8883', {
        clientId,
        username,
        password
    });

    mqttClient.on('connect', () => {
        console.log('Connecté à Live Object via MQTT');
        if (!isSubscribed) {
            mqttClient.subscribe(`fifo/${fifoTechnician}`, { qos: 1 }, (err, granted) => {
                if (err) {
                    console.log('Erreur lors de la souscription au FIFO TrappeOrange', err.message);
                } else {
                    console.log('Souscription au FIFO TrappeOrange réussie:', granted.map(sub => sub.topic).join(','));
                }
            });

            mqttClient.subscribe(`fifo/${fifoDevice}`, { qos: 1 }, (err, granted) => {
                if (err) {
                    console.log('Erreur lors de la souscription au FIFO deviceTrappe', err.message);
                } else {
                    console.log('Souscription au FIFO deviceTrappe réussie:', granted.map(sub => sub.topic).join(','));
                    isSubscribed = true;
                }
            });
        }
    });

    mqttClient.on('close', () => {
        console.log('MQTT connection closed.');
        isSubscribed = false;
    });

    mqttClient.on('message', async (topic, message) => {
        console.log(`Message reçu du topic ${topic}: ${message.toString()}`);

        let parsedData;
        try {
            parsedData = JSON.parse(message.toString());
            console.log('Message MQTT parsé:', parsedData);
        } catch (error) {
            console.error('Erreur de parsing du message MQTT:', error);
            return;
        }

        if (topic === `fifo/${fifoTechnician}`) {
            const mqttData = new MqttData({
                timestamp: new Date(),
                login: parsedData.value.login,
                motifIntervention: parsedData.value.motifIntervention,
                numeroTrappe: parsedData.value.numeroTrappe,
                position: parsedData.value.adress
            });

            try {
                await mqttData.save();
                console.log('Données MQTT enregistrées dans MongoDB:', mqttData);
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement des données MQTT dans MongoDB:', error);
            }
        } else if (topic === `fifo/${fifoDevice}`) {
            const currentTime = new Date();
            const oneMinutesAgo = new Date(currentTime.getTime() - 60 * 1000);

            console.log('Vérification des données de technicien avant d\'envoyer un email d\'alerte...');
            try {
                const recentTechnicianData = await MqttData.find({
                    timestamp: { $gte: oneMinutesAgo }
                });

                console.log('Données de technicien récentes:', recentTechnicianData);

                if (parsedData.value.upcode === 134 && recentTechnicianData.length === 0) {
                    const emailOptions = {
                        to: 'thiabadione@esp.sn',
                        from: 'servicegestiontechnicien@gmail.com',
                        subject: 'Alerte de capteur',
                        text: `Alerte : Un upcode 134 a été reçu du capteur sans intervention de technicien récente.\nDétails : ${JSON.stringify(parsedData)}`,
                    };

                    sgMail.send(emailOptions)
                        .then(() => console.log('Email d\'alerte envoyé.'))
                        .catch((error) => console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error));
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des données de technicien:', error);
            }
        }
    });

    mqttClient.on('error', (err) => {
        console.log('MQTT Error:', err.message);
    });
};

module.exports = mqttClient;
