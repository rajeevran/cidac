var mongoose = require("mongoose");
//Create UserSchema
var IslamicRadioSchema = new mongoose.Schema({
    phone: { type: String},
    radioFilePath: { type: String},
    broadcastFilePath: {type: String, default: ''},
    isBroadcastActive: { type: Boolean, default: false },
    email: {type: String},
    cityId: { type: mongoose.Schema.Types.ObjectId },
    message: {type: String}
},{
    timestamps: true
});

// Export your module
module.exports = mongoose.model("IslamicRadio", IslamicRadioSchema);
