module.exports = function (data) {
    var items = data.items;
    var out = []
    for (var i = 0; i < items.length; i++) {
        var item = items[i].track;

        var a = [];
        for (var j = 0; j < item.artists.length; j++) {
            a.push(item.artists[j].name);
        }
        var t = {
            album: {
                name: item.album.name,
                uid: item.album.id,
                track: item.track_number,
                image: item.album.images[item.album.images.length-2].url //smallest availiable image
            },
            name: item.name,
            uid: item.id,
            artist: a,
            explicit: item.explicit
        };
        out.push(t);
    }
    return out;
}


//console.log(module.exports(require('../dat.json')));