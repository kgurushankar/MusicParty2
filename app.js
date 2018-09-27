//Requires
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cfg = require('./config');


var app = express();

app.use(express.static(__dirname + '/assets'))
    .use(cookieParser())
    .use(bodyParser.urlencoded({
        extended: true
    }));

//  ___  ________   ___  _________   
// |\  \|\   ___  \|\  \|\___   ___\ 
// \ \  \ \  \\ \  \ \  \|___ \  \_| 
//  \ \  \ \  \\ \  \ \  \   \ \  \  
//   \ \  \ \  \\ \  \ \  \   \ \  \ 
//    \ \__\ \__\\ \__\ \__\   \ \__\
//     \|__|\|__| \|__|\|__|    \|__|

//This is for my spotify acc
var tkn = {
    refresh: "", // put this in yourself
    access: "", //nothing since it keeps expiring,
    uid: "" //User UID
};
var session_id = "";
async function init() {
    //generate token
    new_token();
    await delay(1000)
    //setup playlist for the session
    newSession();
    //change this back to new session, maybe have this in the cfg and write w/ stringify later
    //Enable shuffle and repeat capabilities
    //Need to write a proper queue, right now, this functions as a playlist builder
    var options = {
        url: `https://api.spotify.com/v1/me/player/shuffle?state=${cfg.shuffle}`,
        headers: {
            'Accept': "application/json",
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: true
    };
    //can safely assume that the token is still valid (I hope it takes less than an hour)
    request.put(options, function (error, response, body) { });
    options.url = `https://api.spotify.com/v1/me/player/repeat?state=${cfg.repeat}`
    request.put(options, function (error, response, body) { });
    //
}
function newSession() {
    //make the playlist
    var options = {
        url: `https://api.spotify.com/v1/users/${tkn.uid}/playlists`,
        headers: {
            'Accept': "application/json",
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: {
            name: `MusicParty ${new Date().toDateString()}`,
            description: `Playlist made by MusicParty for session started on ${new Date().toDateString()} ${new Date().toTimeString()}.`,
            public: false
        }
    }
    request.post(options, function (error, response, body) { session_id = body.id; })
}
init();
// ________  ___  ___  _________  ___  ___     
// |\   __  \|\  \|\  \|\___   ___\\  \|\  \    
// \ \  \|\  \ \  \\\  \|___ \  \_\ \  \\\  \   
//  \ \   __  \ \  \\\  \   \ \  \ \ \   __  \  
//   \ \  \ \  \ \  \\\  \   \ \  \ \ \  \ \  \ 
//    \ \__\ \__\ \_______\   \ \__\ \ \__\ \__\
//     \|__|\|__|\|_______|    \|__|  \|__|\|__|

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

app.get('/login', function (req, res) {
    var ip = req.connection.remoteAddress;
    //make sure localhost is logging in
    if (ip != '::1') {
        res.send("please log in from the host computer");
    }
    // This piece is essentially a semaphore
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // application requests authorization
    var scope = 'user-modify-playback-state user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: cfg.client_id,
            scope: scope,
            redirect_uri: "http://localhost/callback",
            state: state
        })
    );
    //Goes to spotify to log in, comes back to the {redirect_uri}
});

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: cfg.redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(cfg.client_id + ':' + cfg.client_secret).toString('base64'))
            },
            json: true
        };
        console.dir(authOptions);
        request.post(authOptions, function (error, response, body) {
            console.log(response.statusCode);
            console.dir(body);
            console.dir(error);
            if (!error && response.statusCode === 200) {
                tkn.refresh = body.refresh_token;//saved
                tkn.access = body.access_token;
                res.redirect('/#' +
                    querystring.stringify({
                        success: "tokens_recieved"
                    })
                );
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    })
                );
            }
        });
    }
});

function new_token() {
    // requesting access token from refresh token
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(cfg.client_id + ':' + cfg.client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: tkn.refresh
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            tkn.access = body.access_token;
            console.log(tkn.access);
            return true;
        } else {
            return false;
        }
    });
}
app.listen(cfg.port);// to allow 80, must run as root

// ________  ___  ___  _______   ___  ___  _______           ________  ________   ________          ________  ___       ________      ___    ___ _______   ________     
// |\   __  \|\  \|\  \|\  ___ \ |\  \|\  \|\  ___ \         |\   __  \|\   ___  \|\   ___ \        |\   __  \|\  \     |\   __  \    |\  \  /  /|\  ___ \ |\   __  \    
// \ \  \|\  \ \  \\\  \ \   __/|\ \  \\\  \ \   __/|        \ \  \|\  \ \  \\ \  \ \  \_|\ \       \ \  \|\  \ \  \    \ \  \|\  \   \ \  \/  / | \   __/|\ \  \|\  \   
//  \ \  \\\  \ \  \\\  \ \  \_|/_\ \  \\\  \ \  \_|/__       \ \   __  \ \  \\ \  \ \  \ \\ \       \ \   ____\ \  \    \ \   __  \   \ \    / / \ \  \_|/_\ \   _  _\  
//   \ \  \\\  \ \  \\\  \ \  \_|\ \ \  \\\  \ \  \_|\ \       \ \  \ \  \ \  \\ \  \ \  \_\\ \       \ \  \___|\ \  \____\ \  \ \  \   \/  /  /   \ \  \_|\ \ \  \\  \| 
//    \ \_____  \ \_______\ \_______\ \_______\ \_______\       \ \__\ \__\ \__\\ \__\ \_______\       \ \__\    \ \_______\ \__\ \__\__/  / /      \ \_______\ \__\\ _\ 
//     \|___| \__\|_______|\|_______|\|_______|\|_______|        \|__|\|__|\|__| \|__|\|_______|        \|__|     \|_______|\|__|\|__|\___/ /        \|_______|\|__|\|__|
//           \|__|                                                                                                                   \|___|/                             
var status = {
    id: null,
    volume: null,
    name: null,
    song: {
        current: null,
        length: null,
        uid: null
    },
    playing: false
};
var queue = [];
function addSong(ip, song) {
    var id = song.substring(song.lastIndexOf(":") + 1)
    var options = {
        url: `https://api.spotify.com/v1/tracks/${id}`,
        headers: {
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: true
    };

    //get info on track
    request.get(options, function (error, response, body) {
        if (response.statusCode === 401) {
            new_token();
            addSong(song);
        } else if (!error && response.statusCode === 200) { //Works
            var song = require('./parse/track')(body);
            console.log(`${ip} requested ${song.name}`)
            if (cfg.explicit_ok || !song.explicit) {
                var addTrack = {
                    url: `https://api.spotify.com/v1/users/${tkn.uid}/playlists/${session_id}/tracks?uris=spotify:track:${song.uid}`,
                    headers: {
                        'Accept': "application/json",
                        'Content-Type': "application/json",
                        'Authorization': "Bearer " + tkn.access
                    },
                    json: true
                };
                //going to assume token is good, because just checked that in outer request handler
                request.post(addTrack, function (error, response, body) { });

            } else {
                //maybe log that this track was requested
            }
        } else {
            return;
        }
    });

}


function getPlayerStatus() {
    var player = {
        url: `https://api.spotify.com/v1/me/player/play/`,
        headers: {
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: true
    };
    request.get(player, function (error, response, body) {
        if (response.statusCode === 401) {
            new_token();
            getPlayerStatus();
        } else if (!error && response.statusCode === 200) { //Works
            status = require('./parse/player')(body);
        } else {
            return;
        }
    });
}
function getQueueStatus() {
    var playlist = {
        url: `https://api.spotify.com/v1/users/${tkn.uid}/playlists/${session_id}/tracks`,
        headers: {
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: true
    }
    request.get(playlist, function (error, response, body) {
        //since another request also happened before this, pretty sure this will never be true, but am going to leave it in anyway
        if (response.statusCode === 401) {
            new_token();
            getPlayerStatus();
        } else if (!error && response.statusCode === 200) { //Works
            queue = require('./parse/playlists')(body);
        } else {
            return;
        }
    });
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ________ ________  ________  ________   _________        _______   ________   ________     
// |\  _____\\   __  \|\   __  \|\   ___  \|\___   ___\     |\  ___ \ |\   ___  \|\   ___ \    
// \ \  \__/\ \  \|\  \ \  \|\  \ \  \\ \  \|___ \  \_|     \ \   __/|\ \  \\ \  \ \  \_|\ \   
//  \ \   __\\ \   _  _\ \  \\\  \ \  \\ \  \   \ \  \       \ \  \_|/_\ \  \\ \  \ \  \ \\ \  
//   \ \  \_| \ \  \\  \\ \  \\\  \ \  \\ \  \   \ \  \       \ \  \_|\ \ \  \\ \  \ \  \_\\ \ 
//    \ \__\   \ \__\\ _\\ \_______\ \__\\ \__\   \ \__\       \ \_______\ \__\\ \__\ \_______\
//     \|__|    \|__|\|__|\|_______|\|__| \|__|    \|__|        \|_______|\|__| \|__|\|_______|


app.get('/', function (req, res) {
    //if no spotify account is driving...
    //if (tkn.access == "" || tkn.refresh == "") {
    //res.redirect('/login');
    // new_token();
    // res.redirect('/search');
    //} else {
    res.redirect('/search');
    // }
});

app.get('/search', function (req, res) {
    getQueueStatus();
    var out = `
    <DOCTYPE html>
    <style>
    th {        
        border-bottom: 1px solid black;

    }
    th,table,td {
        padding : 7px;
        border-collapse: collapse;
    }
    </style>
        <head>
    
        </head>
    
        <body>
        <center>
        <form method="GET" action="/search">
        <span>Track</span>
        <input required name="track">
        <input type="submit">        <br />

    </form>
    </center>`;
    var data = req.query.track || '';
    if (data !== '') {
        var authOptions = {
            url: `https://api.spotify.com/v1/search/?type=track&q="${data}"`,
            headers: {
                'Content-Type': "application/json",
                'Authorization': "Bearer " + tkn.access
            },
            json: true
        };
        request.get(authOptions, function (error, response, body) {
            if (response.statusCode === 401) {
                new_token();
                out += `
                        <h1> Error! please retry</h1>
                    </body>
                
                    </html>
                    `;
                res.send(out);
            } else if (!error && response.statusCode === 200) { //Works
                var list = require('./parse/search')(body);
                out += `
                        <table>
                            <tr>
                                <th>Name</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Add to Queue</th>
                            </tr>
                            `;
                for (var i = 0; i < list.length; i++) {
                    var element = list[i];

                    if (element.explicit && !cfg.explicit_ok) { continue; } //dont even display if this is explicit
                    var status = "";
                    var artists = "";
                    for (var j = 0; j < element.artist.length; j++) {
                        artists += element.artist[j];
                        if (j + 1 < element.artist.length) {
                            artists += ", ";
                        }
                    }
                    // initial purpose of this is problematic
                    // if (has(queue, element.uri)) {
                    //     status = "disabled";
                    // }
                    var bg = (i % 2 == 0) ? "#B8D1F3" : "#DAE5F4";
                    out += ` <tr bgcolor="${bg}" opacity=50%>
                                <td>${element.name}</td>
                                
                                <td>${artists}</td>
                                <td>${element.album.name}</td>
                                <td>
                                    <button ${status} onclick="request('${element.uri}');">Add to Queue</button>
                                </td>
                                </tr>
                                `;
                }
                out += `
                
                </body>
                <script src="/jquery.js"></script>
                <script>
                    function request(uri) {
                        $.ajax({
                            url: '/request',
                            dataType: "json",
                            type: "POST",
                            cache: false,
                            data: { uri: uri},
                            success: function (data, textStatus, jqXHR) {
                                alert(data.message);
                                location.reload();
                            },
                            error: function (jqXHR, textStatus, err) {
                                alert('could not connect to server');
                            }
                        });
                    }
                </script>
                </html>`;
                res.send(out);
            } else {//fail
                out += `
                        <h1> Error! please retry</h1>
                    </body>
                
                    </html>
                    `;
                res.send(out);
            }

        });
    } else {
        //List needs to be initialized right
        //need to add a form on the top

        out += `        </body>
    
        </html>`;
        res.send(out);
    }

});
var bAuth = require('express-basic-auth');
app.use('/queue',
    bAuth({
        users: cfg.admin_credential,
        challenge: true
    })
);

app.get('/queue', async function (req, res) {
    getQueueStatus();
    await delay(100);
    var out = `
    <DOCTYPE html>
    <style>
    th {        
        border-bottom: 1px solid black;

    }
    th,table,td {
        padding : 7px;
        border-collapse: collapse;
    }
    </style>
        <head>
    
        </head>
    
        <body>
        <center>
        <!-- Remove this eventually<form method="GET" action="/search">
        <span>Track</span>
        <input required name="track">
        <input type="submit">        <br />

    </form>-->
    </center>`;
    out += `
                        <table>
                            <tr>
                                <th>Name</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Remove from Queue</th>
                            </tr>
                            `;
    for (var i = 0; i < queue.length; i++) {
        var element = queue[i];
        var loc = 0 //queue.indexOf("" + element.id) + 1;
        var status = "";
        var artists = "";
        for (var j = 0; j < element.artist.length; j++) {
            artists += element.artist[j];
            if (j + 1 < element.artist.length) {
                artists += ", ";
            }
        }
        var bg = (i % 2 == 0) ? "#B8D1F3" : "#DAE5F4";
        out += ` <tr bgcolor="${bg}" opacity=50%>
                                <td>${element.name}</td>
                                
                                <td>${artists}</td>
                                <td>${element.album.name}</td>
                                <td>
                                    <button ${status} onclick="remove('${element.uid}',${i});">Remove from queue</button>
                                </td>
                                </tr>
                                `;
    }
    out += `
                
                </body>
                <script src="/jquery.js"></script>
                <script>
                    function remove(uri, i) {
                        $.ajax({
                            url: '/remove',
                            dataType: "json",
                            type: "POST",
                            cache: false,
                            data: { uri: uri,
                                 i: i},
                            success: function (data, textStatus, jqXHR) {
                                alert(data.message);
                                location.reload();
                            },
                            error: function (jqXHR, textStatus, err) {
                                alert('could not connect to server');
                            }
                        });
                    }
                </script>
                </html>`;
    res.send(out);
})

// ________        ___  ________     ___    ___ 
// |\   __  \      |\  \|\   __  \   |\  \  /  /|
// \ \  \|\  \     \ \  \ \  \|\  \  \ \  \/  / /
//  \ \   __  \  __ \ \  \ \   __  \  \ \    / / 
//   \ \  \ \  \|\  \\_\  \ \  \ \  \  /     \/  
//    \ \__\ \__\ \________\ \__\ \__\/  /\   \  
//     \|__|\|__|\|________|\|__|\|__/__/ /\ __\ 
//                                   |__|/ \|__| 

var users = {};
app.post('/request', function (req, res) {
    var ip = req.connection.remoteAddress;
    const delay = 60;//delay between requests in seconds
    //localhost is not limited by delay
    if (Object.keys(users).includes(ip) && ip != '::1') {
        if (Date.now() - users[ip] > delay * 1000) {
            users[ip] = Date.now();
        } else {
            res.json({ message: "Please Wait" });
            return;
        }
    } else {
        users[ip] = Date.now();
    }
    var id = req.body.uri;
    addSong(ip, id);
    res.json({ message: "Song Succesfully Requested" });

});

function has(arr, id) {
    for (var i = 0; i < arr.length; i++) {
        if (id.includes(arr[i].uid)) {
            return true;
        }
    }
    return false;
}

//probably could get screwed if someone figures out how to use postman, but in school env should be fine... (I hope...)
app.post('/remove', function (req, res) {
    var id = req.body.uri;
    var i = req.body.i;
    var options = {
        url: `https://api.spotify.com/v1/users/${tkn.uid}/playlists/${session_id}/tracks`,
        headers: {
            'Accept': "application/json",
            'Content-Type': "application/json",
            'Authorization': "Bearer " + tkn.access
        },
        json: {
            tracks: [
                {
                    uri: `spotify:track:${id}`,
                    positions: [Number(i)]
                }
            ]
        }
    };
    request.delete(options, function (error, response, body) {
        if (response.statusCode == 401) {
            new_token();
            res.json({ message: "Sorry, please try again" });
        } else if (!error && response.statusCode >= 200 && response.statusCode <= 204) {
            res.json({ message: "Song Removed" });
        } else {
            res.json({ message: "Sorry, please try again" });
        }
    })
});