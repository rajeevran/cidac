var apn = require('apn');
var FCM = require('fcm-push');
var path = require('path');
var config = require('./config')('production');
//=====================APN=================================
var apnOne = new apn.Provider({
    cert: __dirname + config.APN_CERTI,
    key: __dirname + config.APN_KEY,
    production: true
});
//====================APN=================================
//====================FCM SETUP FOR PUSH NOTIFICATION=================
var serverKey = config.FCM_SERVER_KEY;
var fcm = new FCM(serverKey);
//====================FCM SETUP FOR PUSH NOTIFICATION=================

var pushNotificationService = {
    iosPush: function (iosData, callback) {
        var all_data=iosData ;
        var note = new apn.Notification();
        note.alert = {
            "title": iosData.title,
            "body": iosData.msg
          };
        //note.payload = all_data;
        note.badge=1;
        note.sound="default";
        note.topic = "com.Brainium.CIDAC";
        note.payload = {pushId: iosData.pushId, noti_type: iosData.noti_type};
        apnOne.send(note, iosData.deviceId).then(result => {
            callback({
                result: result
            })
        });
    },
    androidPush: function (androidData, callback) {
        var message = {
            to: androidData.deviceId, // required fill with device token or topics
            collapse_key: 'demo',
            data: {
                rawData: androidData,
                title: androidData.title,
                user_id: androidData.user_id,
                friend_name: androidData.friend_name,
                pushId: androidData.pushId
            }

        };
        fcm.send(message)
            .then(function (response) {
                callback({
                    success: true,
                    result: response
                })
            })
            .catch(function (err) {
                callback({
                    success: false,
                    result: err
                })
            })
    }
};


module.exports = pushNotificationService;