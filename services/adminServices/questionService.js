var config = require('../../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var ObjectID = mongo.ObjectID;
var Admin = require('../../schema/admin/admin');

//======================MONGO MODELS============================
var QuestionModel = require('../../models/admin/QuestionModel');
//======================Module============================
var mailProperty = require('../../modules/sendMail');


var question = {
    publiclistQaService: function (adminData, callback) {
        QuestionModel.publicQaModel(adminData, function (res) {
            callback(res);
        })
    },
    addQaService: function (adminData, callback) {
        QuestionModel.addQaModel(adminData, function (res) {
            callback(res);
        })
    },
    listQaService: function (adminData, callback) {
        QuestionModel.listQaModel(adminData, function (res) {
            callback(res);
        })
    },
    editQaService: function (adminData, callback) {
        QuestionModel.editQaModel(adminData, function (res) {
            if (res.STATUSCODE == 2000) {
                if (adminData.email != '' && adminData.email != null && adminData.email != undefined) {
                    mailProperty('sendAnswer')(adminData.email, {
                        name: adminData.fullName,
                        email: adminData.email,
                        question: adminData.question,
                        answer: adminData.answer,
                        site_url: config.liveUrl,
                        date: new Date(),
                        logo: config.liveUrl + '' + config.siteConfig.LOGO,
                        site_color: config.siteConfig.SITECOLOR,
                        site_name: config.siteConfig.SITENAME
                    }).send();
                    callback(res);
                } else {
                    callback(res);
                }
            } else {
                callback(res);
            }

        })
    },
    deleteQaService: function (adminData, callback) {
        QuestionModel.deleteQaModel(adminData, function (res) {
            callback(res);
        })
    },
    //#region newscategory

    addQaCategoryService: function (adminData, callback) {
        QuestionModel.addQaCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    listQaCategoryService: function (adminData, callback) {
        QuestionModel.listQaCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    editQaCategoryService: function (adminData, callback) {
        QuestionModel.editQaCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteQaCategoryService: function (adminData, callback) {
        QuestionModel.deleteQaCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllQaCategoryService: function (adminData, callback) {
        QuestionModel.getAllQaCategoryModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion qaCategory
}
module.exports = question;