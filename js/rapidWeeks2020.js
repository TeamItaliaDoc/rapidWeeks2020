var calcolaClassificaRun = false;
var dataGenerale = {};
var U1500 = true;
var U1400 = true;
var U1300 = true;
var U1200 = true;

//https://api.chess.com/pub/tournament/csp-inverno-2018-2019-girone-1/1/1

function elabora() {

//    var url = 'rapidWeeks2020Test.JSON';
    var url = 'rapidWeeks2020.JSON';

    $.getJSON(url,function(data){

        //Imposto le correzioni
        for (var i in data.correzioni) {
            if (data.correzioni[i].win != '') {
                if (! giocatori[data.correzioni[i].win]) 
                    creaGiocatore(data.correzioni[i].win);
                if (! giocatori[data.correzioni[i].lost]) 
                    creaGiocatore(data.correzioni[i].lost);
                var index = giocatori[data.correzioni[i].win].avversario[data.correzioni[i].settimana].indexOf(data.correzioni[i].lost)
                if (index == -1){
                    giocatori[data.correzioni[i].win].avversario[data.correzioni[i].settimana].push(giocatori[data.correzioni[i].lost].displayName);
                    giocatori[data.correzioni[i].win].avversarioPunti[data.correzioni[i].settimana].push(0);
                    giocatori[data.correzioni[i].win].avversarioIndex[data.correzioni[i].settimana].push(0);
                    giocatori[data.correzioni[i].win].avversarioCorrezioni[data.correzioni[i].settimana].push(1);
                } else {
                    giocatori[data.correzioni[i].win].avversarioCorrezioni[data.correzioni[i].settimana][index] ++;
                }
            
            }
        }
                
        //Calcolo i punti
        var iMatch = 0;
        for (var i in data.partite) {
            var partita = data.partite[i];
            if (partita.win != '') {
                iMatch ++;
                setPunti(partita.settimana, partita.win, partita.lost, iMatch);
            }
        }
        
        //Salvo per usarlo in callolaClassifica
        dataGenerale = data.generale;

        //Ricerco elo e stampo classifica giocatori
        getAvatar();

    });

};

//calcolo classifica team
function calcolaClassificaGenerale()
{

    for (var i in dataGenerale) {
        var generale = dataGenerale[i];
        if (generale.n1 != '') {
            giocatori[generale.n1].punti[0] += 10;
            giocatori[generale.n1].generale.partite[generale.settimana] = 10;
            giocatori[generale.n2].punti[0] += 6;
            giocatori[generale.n2].generale.partite[generale.settimana] = 6;
            giocatori[generale.n3].punti[0] += 4;
            giocatori[generale.n3].generale.partite[generale.settimana] = 4;
            giocatori[generale.n4].punti[0] += 3;
            giocatori[generale.n4].generale.partite[generale.settimana] = 3;
            giocatori[generale.n5].punti[0] += 2;
            giocatori[generale.n5].generale.partite[generale.settimana] = 2;
            giocatori[generale.n6].punti[0] += 1;
            giocatori[generale.n6].generale.partite[generale.settimana] = 1;
        }
    }

    //Serve per classifica generale. Imposto 0
    settimana = 0;

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
            if ((giocatori[i].generale.posizione == 0) && (giocatori[i].punti[settimana] > 0)) {
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
                            diretti1 = giocatori[i].avversarioPunti[settimana][index]  + giocatori[i].avversarioCorrezioni[settimana][index];
                            direttiIndex1 = giocatori[i].avversarioIndex[settimana][index];
                        }
                        var diretti2 = 0;
                        index = giocatori[username].avversario[settimana].indexOf(i)
                        if (index == -1) {
                            diretti2 = 0;
                            direttiIndex2 = 999;
                        } else {
                            diretti2 = (giocatori[username].avversarioPunti[settimana][index]) + giocatori[username].avversarioCorrezioni[settimana][index];;
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
                    max = giocatori[i].punti[0];
                }
            }
        
            //Ho un nuovo giocatore da stampare
            if (max > -1) 
            {
                posizione++;
                giocatori[username].generale.posizione = posizione;
                //Stampo il giocatore
                stampaGenerale(username);
            }
        }
}

function stampaGenerale(username)
{
    //Visualizzo classifica
    $("#classificaGeneraleSeparatore").attr('style', '"display":"block"');
    $("#classificaGenerale").attr('style', '"display":"block"');

    var posizioneSt = '#' +  giocatori[username].generale.posizione;
    //controllo premi di categoria
    //primi 3 sono assoluti
    if (giocatori[username].generale.posizione > 3) {
         if ((U1500) && (giocatori[username].elo < 1500)) {
             U1500 = false;
             posizioneSt += '<BR> 1° U1500'; 
         } else {
            if ((U1400) && (giocatori[username].elo < 1400)) {
                U1400 = false;
                posizioneSt += '<BR> 1° U1400'; 
            } else {
                if ((U1300) && (giocatori[username].elo < 1300)) {
                    U1300 = false;
                    posizioneSt += '<BR> 1° U1300'; 
                } else {
                    if ((U1200) && (giocatori[username].elo < 1200)) {
                        U1200 = false;
                        posizioneSt += '<BR> 1° U1200'; 
                    }     
                }
            }
        }            
    }

    //stampa riepilogo settimanale
    var riepilogo = '';
    for (var settimana=1; settimana<11; settimana++) {
        if (giocatori[username].generale.partite[settimana] == 0)
            riepilogo += '<td class="classifica-col4Gen"></td>'
        else
            riepilogo += '<td class="classifica-col4Gen">' + giocatori[username].generale.partite[settimana] +'</td>';
    }

    //stampo riga    
    var riga = '<tr class="classifica-giocatori">' +
        '<td class="classifica-col1">' + posizioneSt + '</td>' +  
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
        '<td class="classifica-col3">' + giocatori[username].punti[0] +'</td>' +
        riepilogo +
        '</tr>';

    //Stampo
    $("#classificaGenerale").append(riga);

}

