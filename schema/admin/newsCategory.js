var mongoose = require("mongoose");
//Create UserSchema
var newsCategorySchemaSchema = new mongoose.Schema({
    name: { type: String}
},{
    timestamps: true
});


// Export your module
module.exports = mongoose.model("NewsCategory", newsCategorySchemaSchema);
