
var ordine = new Array()
var listaArticoli = new Array()
var totaleOrdine = 0
var nome = ""


/*
    Mosta la pagina principale
*/
function showHome(item)
{
    console.log('showHome: '+item)
    document.querySelector('#edtCerca').value=''
    hidePages()
    document.getElementById('pageHome').style.display='block';
    if (item) getMenuItems(item)
}


/**
 * Mostra la pagina con i contatti
 */
function showContatti()
{
    console.log('showContatti')
    hidePages()
    document.getElementById('pageContatti').style.display='block';
}

function hidePages()
{
    var els = document.querySelectorAll('.page')
    for (var x = 0; x < els.length; x++)
        els[x].style.display = 'none';
}


function show(page)
{
    console.log("[show] "+page)
    hidePages()
    document.getElementById(page).style.display='block';
}



/**
 * Cancella un elemento dell'ordine
 * @param {} ev 
 */
function deleteItem(ev){
    var idx = dataOrdine = ev.target.getAttribute('item')
    console.log("> Cancello ", idx)
    ordine.splice(idx,1)
    if (ordine.length)
        showOrdine()
    else showHome()
}




// Legge da DB la situazione delle pizze ordinate e aggiorna l'array pizzeOrdinate
async function contaPizzeOrdinate(){
    pizzeOrdinate = new Array() // reset

    // Lista ordini
    var resRef = firebase.firestore().collection("ordini").where("consegnaData","==",dataOrdine)
    // resRef.get().then( (orderList) => {
    var orderList = await resRef.get()

    // console.log("orderList: ", orderList)
    orderList.forEach(
        function(order){
            var orderData = order.data()

            console.log(orderData)

            // Deve esserci data ed ora di consegna
            if (typeof orderData.consegnaData === 'undefined') return
            if (typeof orderData.consegnaOra === 'undefined') return
            // if (typeof orderData.consegnaFascia === 'undefined') return

            console.log("consData: ",orderData.consegnaData)
            console.log("consOra: ",orderData.consegnaOra)
            //console.log("consFas: ", orderData.consegnaFascia)

            var objOrdine = JSON.parse(orderData.ordine)
            objOrdine.forEach(
                function(ord){
                    if (typeof pizzeOrdinate[orderData.consegnaOra]==='undefined')
                        pizzeOrdinate[orderData.consegnaOra]=0
                    if (ord.tipo=='pizze' || ord.tipo=='speciali')
                        pizzeOrdinate[orderData.consegnaOra] += Number(ord.qty)
                }
            )
        }
    )
    console.log("Ordinate: ", pizzeOrdinate)
}


// Mostra la fascia oraria con l'indicazione delle pizze già ordinate
async function showFascia(){
    var container = document.querySelector('#gridFascia')
    var i = 0;
    var h = new Date()
    // Orario iniziale
    h.setHours(18)
    h.setMinutes(30)

    console.log("QQQ")
    await contaPizzeOrdinate()
    console.log("WWW")

    // Cancello le precedenti
    var hh = document.querySelectorAll(".fascia-item")
    hh.forEach( (val, key) => val.remove())

    fasciaOrdine = -1
    while(i < 14){  // Per ogni fascia oraria genera un div

        var hh = h.getHours() + ":" + (("0"+h.getMinutes()).slice(-2))

        // Nuovo elemento
        var el = document.createElement("div")
        el.classList.add('collection-item')
        el.classList.add('fascia-item')
        el.append(hh)

        if (typeof (pizzeOrdinate[hh]) === 'undefined')
            pizzeOrdinate[hh] = 0

        // el.append(" ["+pizzeOrdinate[hh]+"]")
            
        if (pizzeOrdinate[hh] < 10){
            el.classList.add('fasciaValida')
            el.setAttribute('data', hh)
            el.setAttribute('fascia', i)
            el.addEventListener("click", fasciaScelta)
        }
        else if (pizzeOrdinate[hh] < 15){
            el.classList.add('fasciaWarn')
            el.setAttribute('data', hh)
            el.setAttribute('fascia', i)
            el.addEventListener("click", fasciaScelta)
        }
        else {
            el.classList.add('fasciaNonValida')
        }
        container.append(el)

        // Prossima fascia
        ++i
        h.setMinutes( h.getMinutes()+15)
    }

    // Mostra il giorno scelto
    document.querySelector('#giornoScelto').textContent = "GIORNO: " +
        dataOrdine.substring(6,8)+"-"+dataOrdine.substring(4,6)+"-"+dataOrdine.substring(0,4)
    // Cambio pagina
    document.getElementById('pageGiorno').style.display='none';
    document.getElementById('pageFasciaOraria').style.display='block';
}



function saveOrder(){
    console.log('[+saveOrder]', ordine)

    // Controllo nome
    var nome = document.querySelector("#orderName").value;
    if(nome==""){
        M.toast({html:"Il nome è obbligatorio"});
        return;
    }
    ordine['nome']=nome

    var dbOrdini = firebase.firestore().collection("ordini")
    var id = Date.now().toString();

    // Scrittura record
    dbOrdini.doc(id).set({
        ordine: JSON.stringify(ordine),
        nome: nome,
		data: firebase.firestore.FieldValue.serverTimestamp(),
        servito: false,
        totale: totaleOrdine,
        consegnaData: dataOrdine,
        consegnaOra: orarioOrdine,
        token: gToken
      })
      .then(
         function(){
            console.log("[saveOrder] OK")
            //M.toast({html: "Ordine inviato correttamente"})
            //setTimeout( function(){ResetOrder(); showHome('pizze')}, 4000);
            show('pageFinale')
         }
      )
      .catch(
        function(error){
            console.error("[saveOrder] ", error)
        }
    );
  console.log('[-saveOrder]')
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

function InsertItem(datalist, item, tipo){
    // Titolo pagina
    console.log(item)
    if (item){
        var newSub = document.querySelector('#templateMenu').cloneNode(true);
        newSub.classList.add('itemAdded')
        newSub.querySelector('#submenuTitle').textContent = item
        newSub.style.display='block'
        document.querySelector('#mainList').appendChild(newSub);
    }
    // Lista articoli
    datalist.forEach( dataraw => {
        var data = dataraw.data()
        // In Memoria
        var idx = listaArticoli.push(data) -1
        // A video
        var newEl = document.querySelector('#template').cloneNode(true);
        newEl.classList.add('itemAdded')
        newEl.setAttribute('idx', idx.toString())
        newEl.setAttribute('tipo', tipo)
        //newEl.onclick = showDlgAddToOrder
        newEl.querySelector('#templateTitle').textContent = data.nome
        newEl.querySelector('#templateDesc').textContent = data.ingredienti
        newEl.querySelector('#templatePrice').innerHTML = "&euro; "+data.prezzo.toFixed(2)
        newEl.style.display='block'
        document.querySelector('#mainList').appendChild(newEl);
    })
}


function getMenuItems(item) {
    console.log("[getMenuItems] "+item)
    // Elimina elementi aggiunti precedentemente
    document.querySelectorAll('.itemAdded').forEach( e => e.remove())

    try {
        var items = {};

        // Get Data
        var resRef = firebase.firestore().collection("menu");
        resRef.doc(item).get().then( async(itemSnap) => {
            console.log(itemSnap.id, itemSnap.data())    // Nome sottomenu - es 'Pizze'
            if (itemSnap.data()==undefined){
                document.querySelector('#menuTitle').textContent = "Nessun dato"
                return
            }
            // Compone il titolo
            document.querySelector('#menuIcon').textContent = itemSnap.data().icona
            document.querySelector('#menuTitle').textContent = itemSnap.data().nome
            
            // Lista articoli
            listaArticoli = new Array()

            // Qeusti hanno un sottomenu
            if (item=='ristorante'){
                var r = await waitData("ristorante",'Antipasti');
                InsertItem( r, "Antipasti")

                r = await waitData("ristorante",'Primi piatti');
                InsertItem( r, 'Primi piatti')

                r = await waitData("ristorante",'Secondi');
                InsertItem( r, "Secondi piatti")

                r = await waitData("ristorante",'Contorni');
                InsertItem( r, "Contorni")

                r = await waitData("ristorante",'Dolci');
                InsertItem( r, "Dessert")
            }
            else if (item=='calzoni'){
                var r = await waitData('calzoni','calzoni');
                InsertItem( r, 'Calzoni', 'pizze')

                r = await waitData('calzoni','pizze alte');
                InsertItem( r, "Pizze alte", 'pizze')

            }
            else if (item=='bevande'){
                var r = await waitData('bevande','Bevande');
                InsertItem( r, 'Bevande')
                var r = await waitData('bevande','Dopo cena');
                InsertItem( r, 'Dopo cena')
                var r = await waitData('bevande','Lista dei vini');
                InsertItem( r, 'Lista dei vini')
            }
            else {
                // SubCollection 'stesso nome'
                resRef.doc(item).collection(item).get().then( (subitemSnap) => {
                    var idx = 0
                    subitemSnap.forEach( (subitem) => {
                        // console.log(subitem.data()) // Elemento
                        var data = subitem.data()
                        listaArticoli.push(data)

                        // Duplica l'elemento 'template'
                        var newEl = document.querySelector('#template').cloneNode(true);
                        newEl.classList.add('itemAdded')
                        newEl.setAttribute('idx', idx.toString())
                        newEl.setAttribute('tipo', item)
                        // newEl.onclick = showDlgAddToOrder
                        newEl.querySelector('#templateTitle').textContent = data.nome
                        newEl.querySelector('#templateDesc').textContent = data.ingredienti
                        newEl.querySelector('#templatePrice').innerHTML = "&euro; "+data.prezzo.toFixed(2)
                        newEl.style.display='block'
                        document.querySelector('#mainList').appendChild(newEl);
                        ++idx;
                    })

                    // console.log(listaArticoli)
                })
            }
        })
    } catch (e) {
        return {
            errorMsg: "Something went wrong. Please Try Again."
        }
    }

}


function init() {
    console.log('+init')
    getMenuItems("pizze")   // Prima sezione visualizzata

    let tmp = localStorage.getItem('name');
    if (tmp) document.querySelector('#orderName').value = tmp;

    console.log('-init')
}

// Inizializzazione indipendente dallo stato del serviceWorker
init();
