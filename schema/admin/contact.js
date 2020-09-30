var mongoose = require("mongoose");
var contactSchema = new mongoose.Schema({
    email: { type: String, default: ''},
    phone: { type: String, default: ''},
    message: { type: String, default: '' }
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Contact", contactSchema);
