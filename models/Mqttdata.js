const mongoose = require('mongoose');
const { Schema } = mongoose;

const mqttDataSchema = new Schema({
    timestamp: {
        type: Date,
        required: true
    },
    login: {
        type: String,
        required: true
    },
    motifIntervention: {
        type: String,
        required: true
    },
    numeroTrappe: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    }
});

const MqttData = mongoose.model('MqttData', mqttDataSchema);

module.exports = MqttData;
