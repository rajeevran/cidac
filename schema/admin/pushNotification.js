var mongoose = require("mongoose");
var PushNotificationSchema = new mongoose.Schema({
    cityId: { type: mongoose.Schema.Types.ObjectId },
    deviceToken:{ type: String, default: ''},
    appType:{ type: String, default: ''},
    msg:{ type: String, default: ''},
    noti_type:{ type: String, default: ''},
    objId: { type: mongoose.Schema.Types.ObjectId }
},{
    timestamps: true
});
module.exports = mongoose.model("PushNotification", PushNotificationSchema);