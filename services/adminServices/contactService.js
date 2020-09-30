//======================MONGO MODELS============================
var ContactModel = require('../../models/admin/ContactModel');

var contact = {
    contactUs: function (callback) {
        ContactModel.contactUsDetails(function (res) {
            callback(res);
        })
    },
    editContactUs: function (data,callback) {
        ContactModel.editContactUs(data,function (res) {
            callback(res);
        })
    }
}
module.exports = contact;