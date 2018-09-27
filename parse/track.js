module.exports = function (data) {
    var a = [];
    for (var j = 0; j < data.artists.length; j++) {
        a.push(data.artists[j].name);
    }
    var out = {
        album: {
            name: data.album.name,
            uid: data.album.id,
            track: data.track_number
        },
        name: data.name,
        uid: data.id,
        artist: a,
        explicit: data.explicit
    };
    return out;
}