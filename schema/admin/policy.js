var mongoose = require("mongoose");
//Create PolicySchema
var PolicySchema = new mongoose.Schema({
    text: {type: String, default: ''}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Policy", PolicySchema);
