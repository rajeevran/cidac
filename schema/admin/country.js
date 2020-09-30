var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var countrySchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String},
    sortname: { type: String},
    name: { type: String},
    phoneCode: { type: Number}
});

module.exports = mongoose.model('Country', countrySchema);