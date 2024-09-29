
Progetto Nuova Aurora Banco
===========================

Firebase
........
Creato su Firebase console il nuovo progetto 'Pizzeria Nuova Aurora'.

Aggiungi un web app -> 'Pizzeria NA Banco'
Registrata app 
Copia ed incollato codice proposto dalla registrazione

Nella cartella pwa ho eseguito:
* firebase login
* firebase init
** selezionato 'configure and deploy Firebase hosting sites'
** Avrebbe creato dei files iniziali
* Cambiato il valore di 'default' in .firebaserc perchè puntava ad altro progetto
* firebase deploy


Project Console: https://console.firebase.google.com/project/pizzeria-nuova-aurora/overview
Hosting URL: https://pizzeria-nuova-aurora.web.app


Nella barra in alto è apparsa un'icona/bottone stile 'download', 
premuta la quale è apparso il messaggio di richista di installazione dell'app - oppure
la richiesta di inserimento icone su desktop.
Premuta l'icona è cominciata l'installazione sul cell.


Comunicazione con database
--------------------------
Firestore
Condivide il DB dell'app dei clienti


list() {
   return this.db.collection('/todos', ref => ref.orderBy('complete').orderBy('text')).valueChanges();
}


complete(todo) {
   return this.db.collection('todos').doc(todo.id).update({
     complete: todo.complete,
     updatedAt: firebase.firestore.FieldValue.serverTimestamp()
   });
}

