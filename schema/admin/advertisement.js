var mongoose = require("mongoose");
var AdvertisementSchema = new mongoose.Schema({
    page: { type: String },
    image: { type: String },
    link: { type: String, default: '' },
    imageStatus: { type: Boolean },
    address: { type: String},
    cityId: { type: mongoose.Schema.Types.ObjectId }
},{
    timestamps: true
});

// Export your module
module.exports = mongoose.model("Advertisement", AdvertisementSchema);
