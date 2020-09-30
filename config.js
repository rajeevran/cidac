//let Url = "http://localhost:3103/"
let Url = "https://nodeserver.mydevfactory.com:3103/"

module.exports = {
    "port": 3103,
    "secretKey": "hyrgqwjdfbw4534efqrwer2q38945765",
    production: {
        username: 'brain1uMMong0User',
        password: 'PL5qnU9nuvX0pBa',
        host: '68.183.173.21',
        port: '27017',
        dbName: 'CIDAC',
        authDb: 'admin'
    },
    local: {
        database: "mongodb://localhost:27017/Rito",
        MAIL_USERNAME: "liveapp.brainium@gmail.com",
        MAIL_PASS: "YW5kcm9pZDIwMTY"
    },
    siteConfig: {
        LOGO: 'images/logo.png',
        SITECOLOR: '#17609D',
        SITENAME: 'CIDAC'
    },
    stripe:{
        apiKey: 'sk_test_g0u0xvXJ4EE83rRCyqZlmsMN00keiU7L6O'
    },
    liveUrl: "https://nodeserver.mydevfactory.com:3103/",
    broadcastUrl: 'rtmp://rtmpserver.mydevfactory.com/cidac/',

    uploadIslamicRadioPath:'public/uploads/islamicRadio/',
    uploadNewsPath:'public/uploads/news/',
    uploadAdvertisementPath:'public/uploads/advertisement/',
    uploadMasjidPath:'public/uploads/masjid/',
    masjidPath:Url+'uploads/masjid/',

    uploadServiceProviderPath:'public/uploads/serviceprovider/',
    islamicRadioPath:Url+'uploads/islamicRadio/',
    newsPath:Url+'uploads/news/',
    advertisementPath:Url+'uploads/advertisement/', 
    serviceproviderPath:Url+'uploads/serviceprovider/', 
    logPath: "/ServiceLogs/admin.debug.log",
    dev_mode: true,
    __root_dir: __dirname,
    __site_url: 'http://localhost:3103/',
    limit:10,
    ADMINMAIL:'ipsita12.amstech@gmail.com',
}
