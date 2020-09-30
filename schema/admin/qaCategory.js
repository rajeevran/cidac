var mongoose = require("mongoose");
//Create UserSchema
var qaCategorySchema = new mongoose.Schema({
    name: { type: String}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("QaCategory", qaCategorySchema);
