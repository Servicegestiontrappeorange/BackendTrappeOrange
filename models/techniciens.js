class Technicien {
    constructor({ identifiant, prenom, nom, email, login, motdepasse, motifIntervention, numeroTrappe, address, image
    }) {
        this.identifiant = identifiant;
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.login = login;
        this.motdepasse = motdepasse;
        this.motifIntervention = motifIntervention; // Ajout du motif d'intervention
        this.numeroTrappe = numeroTrappe;
        this.address = address;
        // this.image = image// Ajout du numéro de trappe






    }
}

module.exports = Technicien;