const express = require('express');
const MqttData = require('../models/Mqttdata.js')
const {
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
} = require('../controllers/crud.js');
const router = express.Router();

router.route('/authenticate').post(authenticateTechnicien);
router.route('/techniciens').post(CreateTechnicien);
router.route('/techniciens').get(getTechniciens);
router.route('/techniciens/:id').get(getTechnicien);
router.route('/techniciens/:id').put(UpdateTechnicien);
router.route('/techniciens/:id').delete(DeleteTechnicien);
router.route('/techniciens/:id/details').put(enregistrerDetails);
router.route('/techniciens/login/:login').get(getTechnicienByLogin);
router.route('/techniciens/detailsByLogin/:login').get(getTechnicienDetailsByLogin);



// Route pour récupérer toutes les données MQTT
router.get('/mqttData', async (req, res) => {
    try {
        const data = await MqttData.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/protected-route', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Accès autorisé' });
});


module.exports = router;