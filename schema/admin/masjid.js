var mongoose = require("mongoose");
var pushNotification = require('./pushNotification');
//Create UserSchema
var MasjidSchema = new mongoose.Schema({
    name: { type: String},
    establishmentDate: { type: Date},
    address: { type: String},
    cityId: { type: mongoose.Schema.Types.ObjectId },
    officeHrs: [{ type: Object}],
    scheduleOfficeHrs: [{ type: Object}],
    image:[{ type: String}],
    description: {type: String, default: ''}
},{
    timestamps: true
});

MasjidSchema.pre('remove', async function(next) {
    var masjid = this
    await pushNotification.remove({objId: masjid._id})
    next();
})
// Export your module
module.exports = mongoose.model("Masjid", MasjidSchema);
