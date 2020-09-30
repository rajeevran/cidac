var CityModel = require('../../models/admin/CityModel');

var city = {
    addCity: function (adminData, callback) {
        CityModel.addCity(adminData, function (res) {
            callback(res);
        })
    },
    editCity: function (adminData, callback) {
        CityModel.editCity(adminData, function (res) {
            callback(res);
        })
    },
    listCityForAdmin: function (adminData, callback) {
        CityModel.listCityForAdmin(adminData, function (res) {
            callback(res);
        })
    },
    listCity: function (callback) {
        CityModel.listCity(function (res) {
            callback(res);
        })
    },
}
module.exports = city;