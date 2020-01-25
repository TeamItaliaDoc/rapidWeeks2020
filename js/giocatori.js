
//  Gestione giocatori
//
//         la funziona di stampa classifica deve essere riportata nel js che lo lancia

var getEloRun = false;
var calcolaClassificaGiocatoriRun = false;

var giocatori = [];

function getAvatar() {
    //Cerco avatar
    for (var username in giocatori) {
        getAvatarUrl('https://api.chess.com/pub/player/' + username);
    }
}     

function getAvatarUrl(url)
{
    //Eseguo funzione per ricercare un avatar
    $.getJSON(url,function(dataAvatar){
        if (dataAvatar.avatar) {
            giocatori[dataAvatar.username].avatar = dataAvatar.avatar;
        } else {
            giocatori[dataAvatar.username].avatar = "https://betacssjs.chesscomfiles.com/bundles/web/images/user-image.152ee336.svg";
        }
        giocatori[dataAvatar.username].url = dataAvatar.url;
        giocatori[dataAvatar.username].displayName = dataAvatar.url.substr(29, dataAvatar.url.length-29);

        //Se non ho caricato tuti gli avatar esengo ancora la funzione
        for (var username in giocatori) {
            if (! giocatori[username].avatar) {
                return;
            }
        }
  
        //Finito calcolo. Scrivo i risultati 
        //   Controllo se è già partita la fase di scrittura
        //      se arrivano contemporaneamente più caricamenti potrebbe succedere
        if (! getEloRun)
        {
            getEloRun = true;
            getElo();
        }
    }).error(function(jqXhr, textStatus, error) {
        //è andato in errore ricarico i dati
        getAvatarUrl(this.url);    
        //Per evitare problemi se il giocatore è non esiste,
        //  se va in errore carico l'avatar di default
        //Tolto se il giocatore va in errore bisogna correggere anche stat
        //var username = this.url.substr(33, this.url.length - 32);
        //giocatori[username.toLowerCase()].avatar = "https://betacssjs.chesscomfiles.com/bundles/web/images/user-image.152ee336.svg";

    });

}

function getElo()
{
    //Cerco l'avatar per tutti i giocatori
    for (var username in giocatori) {
        //Cerco avatar
        getEloUrl('https://api.chess.com/pub/player/' + username + '/stats');
    }    
}

function getEloUrl(url)
{
    //Eseguo funzione per ricercare un avatar
    $.getJSON(url,function(data){
        var username = ''
        username = this.url.substr(33, this.url.length-39);
        if (data.chess_daily)
            //giocatori[username].elo = data.chess_rapid.last.rating;
            giocatori[username].elo = data.chess_daily.last.rating;
        else
            giocatori[username].elo = 1200;    
            
        //Se non ho caricato tuti gli elo  esengo ancora la funzione
        for (var username in giocatori) {
            if (! giocatori[username].elo) {
                return;
            }
        }

        if (calcolaClassificaGiocatoriRun)
            return;
            calcolaClassificaGiocatoriRun = true;

        //Calcolo clasifica
        for (var settimana=0; settimana<11; settimana++) {
            calcolaClassificaGiocatori(settimana);
        }

    }).error(function(jqXhr, textStatus, error) {
        //è andato in errore ricarico i dati
        getEloUrl(this.url);    
    });

}

function creaGiocatore(apiUsername) {
    //Uso apiUsername perchè così posso inviare sia username che displayname
    var username = apiUsername.toLowerCase()
    giocatori[username] = {};
    giocatori[username].username = username;
    giocatori[username].url = '';
    giocatori[username].displayName = apiUsername;
    //lo assegno quando lo trovo giocatori[username].avatar = '';
    //lo assegno quando lo trovo giocatori[username].elo = 0;
    giocatori[username].punti = [];
    giocatori[username].avversario = [];
    giocatori[username].avversarioPunti = [];
    giocatori[username].avversarioIndex = [];
    giocatori[username].avversarioCorrezioni = [];
    giocatori[username].posizione = [];
    giocatori[username].generale = {};
    giocatori[username].generale.posizione = 0;
    giocatori[username].generale.partite = [];
    for (var settimana=0; settimana<11; settimana++) {
        giocatori[username].punti[settimana] = 0;
        giocatori[username].posizione[settimana] = 0;
        giocatori[username].avversario[settimana] = [];
        giocatori[username].avversarioPunti[settimana] = [];
        giocatori[username].avversarioCorrezioni[settimana] = [];
        giocatori[username].avversarioIndex[settimana] = [];
        giocatori[username].generale.partite.push(0);
    }
}

function setPunti(settimana, username, avversario, iMatch)
{
    //Se non esiste lo creo
    if (! giocatori[username]) {
        creaGiocatore(username);
    }
    if (! giocatori[avversario]) {
        creaGiocatore(avversario);
    }

    //gli username devono essere sempre in minuscolo
    username = username.toLowerCase();
    avversario = avversario.toLowerCase();

    //Assegno punti
    giocatori[username].punti[settimana] ++;

    //Segno avversari settimana
    var index = giocatori[username].avversario[settimana].indexOf(avversario)
    if (index == -1){
        giocatori[username].avversario[settimana].push(giocatori[avversario].displayName);
        giocatori[username].avversarioPunti[settimana].push(1);
        giocatori[username].avversarioIndex[settimana].push(iMatch);
        giocatori[username].avversarioCorrezioni[settimana].push(0);
    } else {
        giocatori[username].avversarioPunti[settimana][index] ++;
    }

    //Segno avversari generale
    var index = giocatori[username].avversario[0].indexOf(avversario)
    if (index == -1){
        giocatori[username].avversario[0].push(giocatori[avversario].displayName);
        giocatori[username].avversarioPunti[0].push(1);
        giocatori[username].avversarioIndex[0].push(iMatch);
        giocatori[username].avversarioCorrezioni[settimana].push(0);
    } else {
        giocatori[username].avversarioPunti[0][index] ++;
    }
}

function calcolaClassificaGiocatori(settimana)
{
    //Imposto posizione e salvo
    var username = '';
    var max = 0;
    var posizione = 0;
    while (max > -1)
    {
        max = -1;
        for (var i in giocatori)
        {
            var trovato = false;
            var direttiIndex1 = 0;
            var direttiIndex2 = 0;
            //Se ho giocato in questa settimana e non sono già in classifica
            if ((giocatori[i].posizione[settimana] == 0) && (giocatori[i].punti[settimana] > 0)) {
                //se ho un punteggio maggiore
                if (giocatori[i].punti[settimana] > max ) {
                    trovato = true;
                } else if (giocatori[i].punti[settimana] == max ) {
                    //Controllo scontri diretti
                    var diretti1 = 0;
                    var index = giocatori[i].avversario[settimana].indexOf(username)
                    if (index == -1) {
                        diretti1 = 0;
                        direttiIndex1 = 999;
                    } else {
                        diretti1 = giocatori[i].avversarioPunti[settimana][index]   + giocatori[i].avversarioCorrezioni[settimana][index];
                        direttiIndex1 = giocatori[i].avversarioIndex[settimana][index];
                    }
                    var diretti2 = 0;
                    index = giocatori[username].avversario[settimana].indexOf(i)
                    if (index == -1) {
                        diretti2 = 0;
                        direttiIndex2 = 999;
                    } else {
                        diretti2 = (giocatori[username].avversarioPunti[settimana][index])   + giocatori[username].avversarioCorrezioni[settimana][index];
                        direttiIndex2 = giocatori[username].avversarioIndex[settimana][index];
                    }
                    if (diretti1 > diretti2) {
                        trovato = true;
                    } else if (diretti1 == diretti2 ) {  
                        //controllo chi ha vinto con più avversari
                        if (giocatori[i].avversario[settimana].length > giocatori[username].avversario[settimana].length) {
                            trovato = true;
                        }  else if (giocatori[i].avversario[settimana].length == giocatori[username].avversario[settimana].length) {
                            //Controllo chi ha vinto la prima partita
                            if (direttiIndex1 < direttiIndex2) {
                                trovato = true;
                            }
                        }
                    }
                }
            }
            //Ho trovato un giocatore
            if (trovato) {
               // posizione ++;
                username = i;
                max = giocatori[i].punti[settimana];
                //giocatori[i].posizione[settimana] = posizione;
            }
        }
    
        //Ho un nuovo giocatore da stampare
        if (max > -1) 
        {
            posizione++;
            giocatori[username].posizione[settimana] = posizione;
            //Stampo il giocatore
            stampaGiocatore(settimana, username);
        }
    }

    //Calcolo classifica generale
    calcolaClassifica();

   
 }
 
function stampaGiocatore(settimana, username)
{
    //Avversari
    var avversari = '<td class="classifica-col4">';
    for (var i in giocatori[username].avversario[settimana]) {
        avversari += giocatori[username].avversario[settimana][i] + '(' + giocatori[username].avversarioPunti[settimana][i] + ') - ';
    }
    //tolgo ultimi caratteri
    avversari = avversari.substring(0, avversari.length - 3) + '</td>';

    //stampo riga    
    var riga = '<tr class="classifica-giocatori">' +
        '<td class="classifica-col1">#' + giocatori[username].posizione[settimana] + '</td>' +  
        '<td class="giocatori-col1SEP"></td>' + 
        '<td class="classifica-col2">' +
        '    <table><tr>' +
        '        <td>' +
        '        <img class="classifica-avatar" src="' + giocatori[username].avatar + '">' +
        '    </td>' +
        '    <td width=7px></td>' +
        '    <td><div>' +
        '            <a class="username" href="' + giocatori[username].url + '" target=”_blank”> ' + giocatori[username].displayName + '</a>' +
        '        </div> <div>  (' + giocatori[username].elo + ') </div>' +
        '        </td>' +    
        '    </tr></table>' +
        '</td>' +
        '<td class="classifica-col3">' + giocatori[username].punti[settimana] +'</td>' +
        avversari + 
        '</tr>';

    //Stampo
    if (settimana == 1)
       $("#RW1").append(riga);
    if (settimana == 2)
       $("#RW2").append(riga);
    if (settimana == 3)
       $("#RW3").append(riga);
    if (settimana == 4)
       $("#RW4").append(riga);
    if (settimana == 5)
        $("#RW5").append(riga);
    if (settimana == 6)
       $("#RW6").append(riga);
    if (settimana == 7)
       $("#RW7").append(riga);
    if (settimana == 8)
       $("#RW8").append(riga);
    if (settimana == 9)
       $("#RW9").append(riga);
    if (settimana == 10)
       $("#RW10").append(riga);

}
