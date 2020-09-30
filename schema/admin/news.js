var mongoose = require("mongoose");
var NewsSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String},
    image: { type: String},
    description: {type: String, default: ''},
    address: { type: String},
    cityId: { type: mongoose.Schema.Types.ObjectId }
},{
    timestamps: true
});
// Export your module
module.exports = mongoose.model("News", NewsSchema);
