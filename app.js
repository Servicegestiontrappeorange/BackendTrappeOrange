const express = require('express');
const http = require('http');
const { connect } = require('./db/connect');
const { connectMqttDB } = require('./db/connectMqtt');
const app = express();
const server = http.createServer(app);
const technicienRouter = require('./routes/techniciens.js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mqttClient = require('./controllers/MqttClient');
const fs = require('fs');

// Config pour l'upload de fichiers images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'upload_AvInt'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const storage1 = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'upload_ApInt'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });
const upload1 = multer({ storage: storage1 });

app.use(cors({ origin: '*', optionsSuccessStatus: 200, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api", technicienRouter);

// Serveur de fichiers statiques
app.use('/upload_AvInt', express.static('upload_AvInt'));
app.use('/upload_ApInt', express.static('upload_ApInt'));

app.post('/api/techniciens/upload_AvInt', upload.single('file'), (req, res) => {
  res.json({ message: 'Image Uploaded', filename: req.file.filename });
});
app.post('/api/techniciens/upload_ApInt', upload1.single('file'), (req, res) => {
  res.json({ message: 'Image Uploaded', filename: req.file.filename });
});

app.get('/api/images', (req, res) => {
  const directoryPath = path.join(__dirname, 'upload_AvInt');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      res.status(500).send('Unable to scan files!');
    } else {
      let imageFiles = files.filter(file => (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')));
      res.send(imageFiles);
    }
  });
});

app.get('/api/images_1', (req, res) => {
  const directoryPath = path.join(__dirname, 'upload_ApInt');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      res.status(500).send('Unable to scan files format is not matched!');
    } else {
      let imageFiles = files.filter(file => (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')));
      res.send(imageFiles);
    }
  });
});

connect(process.env.MONGO_URI, (err) => {
  if (err) {
    console.log("Impossible de se connecter à la base de données techniciens");
    process.exit(-1);
  } else {
    console.log("Connexion à la base de données techniciens réussie");
  }
});

connectMqttDB(process.env.MONGO_URI, (err) => {
  if (err) {
    console.log("Impossible de se connecter à la base de données MQTT");
    process.exit(-1);
  } else {
    console.log("Connexion à la base de données MQTT réussie");
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mqttClient();
});
