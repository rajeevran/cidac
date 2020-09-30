var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var islamSchema = new Schema({
    description: { type: String}
},{
    timestamps: true
});

module.exports = mongoose.model('Islam', islamSchema);