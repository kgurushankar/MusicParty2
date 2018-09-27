module.exports = {
    client_id: '', //get your own
    client_secret: '',
    admin_credential: {//leave empty to disable the queue endpoint
        "root": "admin"
    },
    explicit_ok: false,
    delay: 30, //delay between multiple requests from same device in seconds
    port: 80, //80 requires root on linux, but should work fine on other os's provided no other process is using the port
    shuffle: true,
    repeat: true
}