var citySchema = require('../../schema/admin/city');

var cityModel = {
    addCity: async function (data, callback) {
        if (data) {
            new citySchema(data)
                .save(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted successfully.",
                        response: r
                    });
                })
                .catch(err => {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Error.",
                        response: err
                    });
                })

        }
    },
    editCity: async function (data, callback) {
        if (data) {
            citySchema.update(
                { _id: data._id },
                {
                    $set: {
                        name: data.name
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
    },
    listCityForAdmin: async function (data, callback) {
        var searchArray = [];

        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        } else {
            searchArray.push({})
        }
        var qry = { $or: searchArray };
        citySchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countCity = await citySchema.countDocuments(qry).exec()
        let cities = await citySchema.find(qry)
            .skip(data.offset).limit(data.limit).sort({ name: 1 })
            .exec();
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countCity,
            response: cities
        })
    },
    listCity: async function (callback) {
        citySchema.find().sort({ 'name': 1 })
            .then(r => {
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    response:r
                });
            })
    },
}
module.exports = cityModel;