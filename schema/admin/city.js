var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var citySchema = new Schema({
    name: { type: String}
    
});

module.exports = mongoose.model('City', citySchema);