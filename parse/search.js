module.exports = function (data) {
    var l = data.tracks.items;
    var out = [];
    for (var i = 0; i < l.length; i++) {
        var item = l[i];
        var a = [];
        for (var j = 0; j < item.artists.length; j++) {
            a.push(item.artists[j].name);
        }
        var d2 = {
            name: item.name,
            uri: item.uri,
            album: {
                name: item.album.name,
                uri: item.album.uri,
                track: item.track_number,
                image: item.album.images[item.album.images.length - 2].url
            },
            artist: a,
            explicit: item.explicit
        }

        out.push(d2);

    }
    return out;
}

// console.log(JSON.stringify(module.exports(require('../dat.json'))));