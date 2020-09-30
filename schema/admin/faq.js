var mongoose = require('mongoose');

var faqSchema = new mongoose.Schema({
    question: {type: String},
    answer: {type: String, default: ''}
}, {
    timestamps: true
});

module.exports = mongoose.model('Faq', faqSchema);