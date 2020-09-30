var contactSchema = require('../../schema/admin/contact');


var contactModel = {
    contactUsDetails: async function (callback) {
        let contact = await contactSchema.find()
            .exec();
        if (contact.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: contact[0]
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: []
            })
        }
    },
    editContactUs: async function (data, callback) {
        if (data) {
            console.log('data',data)
            contactSchema.update(
                { _id: data._id },
                {
                    $set: {
                        phone: data.phone,
                        email: data.email,
                        message: data.message
                    }
                }
            ).then(r => {
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success"
                });
            })
        }
    }
}
module.exports = contactModel;