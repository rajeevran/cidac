var mongoose = require("mongoose");
//Create UserSchema
var QaSchema = new mongoose.Schema({
    question:{ type: String, default: ''},
    type: { type: String, enum: ['private', 'public'], default: 'public'},
    categoryId: { type: mongoose.Schema.Types.ObjectId },
    fullName:{ type: String, default: ''},
    email:{ type: String, default: ''},
    answer: {type: String, default: ''}
},{
    timestamps: true
});

// Export your module
module.exports = mongoose.model("Qa", QaSchema);
