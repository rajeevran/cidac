var mongoose = require("mongoose");
//Create UserSchema
var QuestionSchema = new mongoose.Schema({
    questionId: { type: Number},
	question: {type: String, required: true},
    options: {
        one: {answers:{type: String, required: true},parcent: {type: Number, required: true}},
        two: {answers:{type: String, required: true},parcent: {type: Number, required: true}},
        three: {answers:{type: String, required: true},parcent: {type: Number, required: true}},
        four: {answers:{type: String, required: true},parcent: {type: Number, required: true}},
    },
    answer: {type: Number , required: true},
    answerKey: {type: Number , required: true},
    description: {type: String, default: ''}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Question", QuestionSchema);
