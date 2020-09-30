var mongoose = require("mongoose");
var ServiceProviderSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String},
    companyName: { type: String},
    companyWebsite: { type: String},
    contact: { type: String},
    address: { type: String},
    image: { type: String},
    description: {type: String, default: ''},
    cityId: { type: mongoose.Schema.Types.ObjectId },
    address: { type: String}
},{
    timestamps: true
});

// Export your module
module.exports = mongoose.model("ServiceProvider", ServiceProviderSchema);
