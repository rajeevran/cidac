var commonMethod = require("../../utility/common");
const fetch = require('node-fetch');
var QaSchema = require('../../schema/admin/qa');
var QaCategorySchema = require('../../schema/admin/qaCategory');
const axios = require('axios')
const moment = require('moment')
var config = require('../../config');
var async = require("async");
var bcrypt = require('bcrypt-nodejs');
var mailProperty = require('../../modules/sendMail');
var jwt = require('jsonwebtoken');
var jwtOtp = require('jwt-otp');
var fs = require('fs');
var csvtojson = require("csvtojson");
var mongoose = require('mongoose');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

var questionModel = {
    addQaModel: async function (data, callback) {
        if (data) {
            var qaSchema = {
                question: data.question,
                type: data.type,
                fullName: data.fullName,
                email: data.email,
                categoryId: data.categoryId
            }
            console.log('qaSchema', qaSchema);
            new QaSchema(qaSchema)
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
    listQaModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];

        if (data.searchTerm) {
            searchArray.push({ 'question': new RegExp(data.searchTerm, 'i') });
        } else {
            searchArray.push({})
        }
        
        if (data.searchDate) {
            const dt = new Date(new Date(data.searchDate).setDate(new Date(data.searchDate).getDate()+1));
            searchArray.push({'createdAt': {$gt: new Date(data.searchDate), $lt: new Date(dt)}});
        }

        var qry = { $and: searchArray };
        let countQa = 0;
        QaSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countQa = resCount;
            }
        })
        // let countQa = await QaSchema.countDocuments(qry).exec()
        let qa = await QaSchema.find(qry)
            .skip(data.offset).limit(data.limit).sort({ createdAt: 'desc' })
        for (let index = 0; index < qa.length; index++) {
            const categoryId = qa[index].categoryId;
            let qaCategory = await QaCategorySchema.findOne({ _id: categoryId })
            combineResponse.push({ ...qa[index].toObject(), categoryName: qaCategory.name })
        }
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countQa,
            response: combineResponse
        })
    },
    editQaModel: async function (data, callback) {
        if (data) {
            QaSchema.update(
                { _id: data._id },
                {
                    $set: {
                        answer: data.answer,
                        categoryId: data.categoryId
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
    deleteQaModel: async function (data, callback) {
        var obj = data.options;
        //console.log(obj);

        var answer = 0
        var answer_key = 0;
        var counter = 0;

        //    console.log("data.image--->",data.image);

        if (data) {

            QaSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    publicQaModel: async function (data, callback) {
        let qry = {};
        var combineResponse = [];
        qry["type"] = 'public';
        qry["answer"] = {$ne: ""};
        QaSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countQa = await QaSchema.countDocuments(qry).exec()
        let sortRecord = {};
        let pageIndex = 1;
        let pageSize = parseInt(config.limit);
        let limitRecord = pageSize;
        let skipRecord = 0;
        if (data.pageSize) {
            pageSize = parseInt(data.pageSize);
        }
        if (data.pageIndex) {
            pageIndex = parseInt(data.pageIndex);
        }
        if (pageIndex > 1) {
            skipRecord = (pageIndex - 1) * pageSize;
        }
        limitRecord = pageSize;
        if (data.pageSize) {
            pageSize = parseInt(data.pageSize);
        }
        if (data.pageIndex) {
            pageIndex = parseInt(data.pageIndex);
        }
        if (pageIndex > 1) {
            skipRecord = (pageIndex - 1) * pageSize;
        }
        limitRecord = pageSize;
        if (data.categoryId && data.categoryId != '-1') {
            qry["categoryId"] = data.categoryId;
        }

        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            } else {
                sortType = 1;
            }

            sortRecord[sortBy] = sortType;
        } else {
            sortRecord = { createdAt: -1 };
        }
        let questionList = await QaSchema.find(qry)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < questionList.length; index++) {
            const categoryId = questionList[index].categoryId;

            let QaCategory = await QaCategorySchema.findOne({ _id: categoryId })

            combineResponse.push({ ...questionList[index].toObject(), categoryName: QaCategory.name })

        }
        let newsCountFiltered = await QaSchema.find(qry)
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countQa,
            filteredData: newsCountFiltered.length,
            response: combineResponse
        });

    },

    addQaCategoryModel: async function (data, callback) {
        if (data) {
            var qaSchema = {
                name: data.name
            }
            new QaCategorySchema(qaSchema)
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
    listQaCategoryModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }

        var qry = { $or: searchArray };
        QaCategorySchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countQaCategory = await QaCategorySchema.countDocuments(qry).exec()


        let qaCategory = await QaCategorySchema.find(qry)
            .sort({ name: 1 })
            .skip(data.offset)
            .limit(data.limit)

        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countQaCategory,
            response: qaCategory
        })



    },
    editQaCategoryModel: async function (data, callback) {
        var obj = data.options;
        var answer = 0
        var answer_key = 0;
        var counter = 0;
        if (data) {
            QaCategorySchema.update(
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
    deleteQaCategoryModel: async function (data, callback) {
        var obj = data.options;
        var answer = 0
        var answer_key = 0;
        var counter = 0;
        if (data) {
            QaCategorySchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllQaCategoryModel: async function (data, callback) {
        QaCategorySchema.find()
            .then(res => {
                callback({
                    success: true,
                    STATUSCODE: 2000,
                    message: "Success",
                    response: res
                });
            })
            .catch(err => {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            })
    },
}
module.exports = questionModel;