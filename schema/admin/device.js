var mongoose = require("mongoose");
var DeviceSchema = new mongoose.Schema({
    cityId: { type: mongoose.Schema.Types.ObjectId },
    appType: { type: String, enum: ['IOS', 'ANDROID'], default: 'IOS'},
    deviceToken:{ type: String, default: '', unique: true}
},{
    timestamps: true
});
module.exports = mongoose.model("Device", DeviceSchema);
