var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var pillerofislamSchema = new Schema({
    description: { type: String}
},{
    timestamps: true
});

module.exports = mongoose.model('Pillerofislam', pillerofislamSchema);