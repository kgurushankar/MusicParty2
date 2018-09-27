var l = require('./dat.json').tracks.items;
// console.log(d.name);
// console.log(d.uri)
// console.log(d.album.name)
// console.log(d.album.uri)
// console.log(d.artists[0].name)
// console.log(d.track_number)
for (var i = 0; i < l.length; i++) {
    var d = l[i];

    var a = [];
    for (var b = 0; b < d.artists.length; b++) {
        a.push(d.artists[b].name);
    }
    var d2 = {
        name: d.name,
        uri: d.uri,
        album: {
            name: d.album.name,
            uri: d.album.uri,
            track: d.track_number
        },
        artist: a
    }

    console.dir(d2);

}