var mongoose = require("mongoose");
//Create UserSchema
var donationCategorySchema = new mongoose.Schema({
    name: { type: String},
    message: {type: String}
},{
    timestamps: true
});
// Export your module
module.exports = mongoose.model("donationCategory", donationCategorySchema);
