var mongoose = require("mongoose");
var donationSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId },
    unit: { type: String, enum: ['CAD', 'USD'], default: 'USD'},
    amount:{ type: Number, default: 0},
    fullName:{ type: String, default: ''},
    email:{ type: String, default: ''},
    address:{ type: String, default: ''},
    transactionId:{ type: String, default: ''},
    comment:{ type: String, default: ''}
},{
    timestamps: true
});
// Export your module
module.exports = mongoose.model("donation", donationSchema);