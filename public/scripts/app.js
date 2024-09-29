
var ordine = new Array()
var listaArticoli = new Array()
var totaleOrdine = 0

/*
    Mosta la pagina principale
*/
function showHome(item)
{
    console.log('showHome '+item)
    document.getElementById('pageContatti').style.display='none';
    document.getElementById('pageOrdine').style.display='none';
    document.getElementById('pageHome').style.display='block';
    getMenuItems(item)
}


/**
 * Mostra la pagina con i contatti
 */
function showContatti()
{
    console.log('showContatti')
    document.getElementById('pageContatti').style.display='block';
    document.getElementById('pageHome').style.display='none';
    document.getElementById('pageOrdine').style.display='none';
}


function showOrdine()
{
    console.log('showOrdine')
    if (ordine.length==0){
        M.toast({html: "Nessun elemento in ordine"})
        return
    }
    // Svuota eventuale lista precedente
    document.querySelectorAll('.addedOrder').forEach( e => e.remove())
    // Riempie la pagina Ordine
    var template = document.querySelector('#templateOrdine');
    var list = document.querySelector('#mainListOrdine');
    var totaleDiv = document.querySelector('#totaleOrdine');

    totaleOrdine = 0;
    ordine.forEach( function( val, idx){
        var newSub = document.querySelector('#templateOrdine').cloneNode(true);
        newSub.style.display='block'
        newSub.classList.add('addedOrder')
        newSub.querySelector('#templateOrdineTitle').textContent = val.nome
        newSub.querySelector('#templateOrdineNo').textContent = val.qty
        document.querySelector('#mainListOrdine').appendChild(newSub)
        totaleOrdine += Number(val.qty)*Number(val.prezzo)
    })
    totaleDiv.innerHTML = "Totale ordine: <b>&euro; "+totaleOrdine.toFixed(2)+"</b>"

    // Mostra pagina
    document.getElementById('pageOrdine').style.display='block';
    document.getElementById('pageHome').style.display='none';
}

// Mostra la dlg con la richiesta della quantità
function showDlgAddToOrder(e){

    console.log("[showDlgAddToOrder]")
    if (dlgAddToOrder==null){
        console.error("dlgAddToOrder non definito!")
        return
    }
    var p = e.srcElement.parentElement
    while(p.tagName!='LI'){
        p = p.parentElement
    }
    var idx = p.getAttribute('idx')
    var data = listaArticoli[idx]
    // Aggiorna i dati in dlg
    document.querySelector('#dlgAddIdx').val = idx
    document.querySelector('#dlgAddNumero').textContent = "1"
    document.querySelector('#dlgAddNome').textContent = data.nome
    // Apre la dlg
    var dlg = dlgAddToOrder[0]
    dlg.open()
}


// Mostra la dlg con i settings
function showDlgSettings(){

    console.log("[showDlgSettings]")
    if (dlgSettings==null){
        console.error("dlgSettings non definito!")
        return
    }
    // Aggiorna i dati in dlg
    //document.querySelector('#dlgAddIdx').val = idx
    document.querySelector('#dlgAddNumero').textContent = "1"
    //document.querySelector('#dlgAddNome').textContent = data.nome
    // Apre la dlg
    //var dlg = dlgAddToOrder[0]
    dlgSettings.open()
}




function sendEmail(){
    console.log('[sendEmail]')
    emailSubject = "Ordine Nuova Aurora"
    emailBody = "Ordine:\n1 cipolle + origano\n1 vetegale\n\nGrazie\n\n"
    window.location.href = "mailto:stefano.mora@libero.it?subject=" + emailSubject + "&body=" + emailBody
}



function saveOrder(){
    console.log('[saveOrder]', ordine)

    // Controllo nome
    var nome = document.querySelector("#orderName").value;
    if(nome==""){
        M.toast({html:"Il nome è obbligatorio"});
        return;
    }
    ordine['nome']=nome

    var dbOrdini = firebase.firestore().collection("ordini")
    var id = Date.now().toString(); // dbOrdini.createId();

    // Scrittura record
    dbOrdini.doc(id).set({
        ordine: JSON.stringify(ordine), // "Ordine",
        nome: nome,
		data: firebase.firestore.FieldValue.serverTimestamp(),
        servito: false,
        totale: totaleOrdine
      })
      .then(
         function(){
            console.log("[saveOrder] OK")
            M.toast({html: "Ordine inviato correttamente"})
            setTimeout( function(){ResetOrder(); showHome('pizze')}, 4000);
         }
      )
      .catch(
        function(error){
            console.error("[saveOrder] ", error)
        }
    );
  console.log('[saveOrder]')
}


function ResetOrder() {
    // Reset lista
    ordine = new Array()
    updateBadge(0)
}

async function getData()  {
    console.log("getData")
    try {
        var restaurant = {};

        // Get Restaurant Data
        var resRef = firebase.firestore().collection("menu");
        var resSnap = await resRef.get();
        // console.log(resSnap)
        resSnap.forEach((doc) => {
            console.log(doc.data())
        })
        getMenuItems("pizze")
        return restaurant
    } catch (e) {
        console.error(e)
        return {
            errorMsg: "Something went wrong. Please Try Again."
        }
    }
}


function waitData(submenu, item) {
    return firebase.firestore().collection("menu").doc(submenu).collection(item).get()
}

function InsertItem(datalist, item){
    // Titolo pagina
    console.log(item)
    if (item){
        var newSub = document.querySelector('#templateMenu').cloneNode(true);
        newSub.classList.add('itemAdded')
        newSub.querySelector('#submenuTitle').textContent = item
        newSub.style.display='block'
        document.querySelector('#mainList').appendChild(newSub);
    }

    datalist.forEach( dataraw => {
        var data = dataraw.data()
        // In Memoria
        var idx = listaArticoli.push(data) -1
        // A video
        var newEl = document.querySelector('#template').cloneNode(true);
        newEl.classList.add('itemAdded')
        newEl.setAttribute('idx', idx.toString())
        newEl.onclick = showDlgAddToOrder
        newEl.querySelector('#templateTitle').textContent = data.nome
        newEl.querySelector('#templateDesc').textContent = data.ingredienti
        newEl.querySelector('#templatePrice').innerHTML = "&euro; "+data.prezzo.toFixed(2)
        newEl.style.display='block'
        document.querySelector('#mainList').appendChild(newEl);
    })
}



function getOrdini(item) {
    console.log("[+getOrdini] "+item)
    // Elimina elementi aggiunti precedentemente
    document.querySelectorAll('.itemAdded').forEach( e => e.remove())

    try {
        var orders = {};
        var nOrdini = 0;
        var nElementi = 0;

        // Get Data
        var resRef = firebase.firestore().collection("ordini");
        resRef.get().then( async(orderList) => {

            // console.log("orderList: ", orderList)    // 

            orderList.forEach(
                function(order){
                    var orderData = order.data();
                    console.log(orderData)
                    console.log(orderData.id)

                    ++nOrdini

                    var jsonOrder = orderData.ordine
                    if(typeof jsonOrder=='undefined')
                        jsonOrder = "{\"ordine\":[{\"nome\":\"Problema nei dati\",\"qty\":\"-\"}]}"
                    if(jsonOrder.startsWith("["))
                        jsonOrder = "{\"ordine\":"+jsonOrder+"}"
                    console.log("json: ",jsonOrder)
                    var objOrdine = JSON.parse(jsonOrder)
                    objOrdine.ordine.forEach(
                        function(elemento){
                            console.log(elemento.nome)

                            // Duplica l'elemento 'template'
                            var newEl = document.querySelector('#template').cloneNode(true);
                            newEl.classList.add('itemAdded')
                            // newEl.setAttribute('idx', idx.toString())
                            // newEl.onclick = showDlgAddToOrder
                            newEl.querySelector('#templateTitle').textContent = elemento.nome
                            newEl.querySelector('#templateDesc').textContent = orderData.nome + " - " + orderData.data.toDate()
                            //newEl.querySelector('#templatePrice').innerHTML = "&euro; "+data.prezzo.toFixed(2)
                            newEl.querySelector('#templatePrice').innerHTML = elemento.qty

                            newEl.style.display='block'
                            document.querySelector('#mainList').appendChild(newEl);

                            var n = Number(elemento.qty)
                            if (!isNaN(n)) nElementi += n
                        }
                    )
                }
            )

            document.querySelector('#menuTitle').textContent = "Ordini: "+nOrdini+" - Elementi: "+nElementi
        })
    } catch (e) {
        console.error(e)
        return {
            errorMsg: "Something went wrong. Please Try Again."
        }
    }
    console.log("[-getOrdini]")
}


function init() {
    console.log('init')
    getOrdini("non")
    console.log('init end')
}

// Inizializzazione indipendete dallo stato del serviceWorker
init();
