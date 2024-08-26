# TrappeOrangeBackend

Ce répertoire git contient le backend de l'application Trappe Orange et sera utilisé pour la production.

Ce backend a été réalisé avec Node.js et Express.js. Le fichier `app.js` constitue le fichier d'entrée de notre backend. C'est ici que nous gérons l'aspect critique de notre application, y compris les middlewares, qui sont des fonctions ayant accès à l'objet de la requête `req`, l'objet de la réponse `res`, et la fonction `next()` dans le cycle de requête-réponse d'une application Node.js. Le fichier `app.js` contient également les routes pour l'accès aux différentes API, la connexion à la base de données, et centralise la configuration et le démarrage de notre application.

Le dossier `routes` contient le fichier `techniciens.js`, qui inclut toutes les routes pour accéder aux différentes fonctionnalités de notre application, notamment les opérations de CRUD, d'authentification, d'envoi de données vers LiveObject, et d'enregistrement des données MQTT fournies par l'utilisateur de l'application mobile.

