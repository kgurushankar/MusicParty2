module.exports = function (data) {
    return {
        id: data.device.id,
        volume: data.device.volume_percent,
        name: data.device.name,
        playing: data.is_playing,
        song: {
            current: data.progress_ms,
            length: data.item.duration_ms,
            uid: data.item.name
        }
    }
}