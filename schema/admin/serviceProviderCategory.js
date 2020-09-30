var mongoose = require("mongoose");
//Create UserSchema
var serviceProviderCategorySchema = new mongoose.Schema({
    name: { type: String},
    description: { type: String}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("ServiceProviderCategory", serviceProviderCategorySchema);
