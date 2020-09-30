var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var stateSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String},
    name: { type: String},
    country_id: { type: String}
});

module.exports = mongoose.model('State', stateSchema);