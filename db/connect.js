const { MongoClient, Db } = require('mongodb');

let client = null;

function connect(url, callback) {
    if (client === null) {
        client = new MongoClient(url)
        client.connect((err) => {
        if (err) {
                client = null;
                callback(err);
            } else {
                //si la connexion réussi on créé la collection
                const db = client.db("MabaseTech");
                db.createCollection("techniciens", (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log("Collection 'etchniciens créé avec succes'");
                        callback();
                    }

                });

            }
        })
    } else {
        callback();
    }
}

function db() {
    const db = new Db(client, "MabaseTech");
    return db;

}

function fermer(client) {
    if (client) {
        client.close();
        client = null;
    }
}

module.exports = { connect, client, db, fermer };