const mongoose = require('mongoose');

const connectMqttDB = (url, callback) => {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to MQTT Database');
            callback(null);
        })
        .catch((err) => {
            console.log('Erreur losr de la connexion à la base de donnée Mqtt')
            callback(err);
        });
};

module.exports = { connectMqttDB };