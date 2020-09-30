var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var orderCounterchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    orderId: { type: String},
    seq: { type: Number}
    
});

module.exports = mongoose.model('Counter', orderCounterchema);