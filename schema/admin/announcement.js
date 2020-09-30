var mongoose = require("mongoose");
//Create UserSchema
var AnnouncementSchema = new mongoose.Schema({
    announcementStatus: { type: Boolean },
    cityId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: '' }    
},{
    timestamps: true
});
// Export your module
module.exports = mongoose.model("Announcement", AnnouncementSchema);
