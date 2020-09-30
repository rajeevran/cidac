var commonMethod = require("../../utility/common");
const fetch = require('node-fetch');
var donationSchema = require('../../schema/admin/donation');
var donationCategorySchema = require('../../schema/admin/donationCategory');
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


var donationModel = {
    addDonationCategory: async function (data, callback) {
        if (data) {
            new donationCategorySchema(data)
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
    listDonationCategory: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];

        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }
        var qry = { $or: searchArray };
        donationCategorySchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countDonationCategory = await donationCategorySchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["name"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id && data._id != '-1') {
            searchFilters["_id"] = data._id;
        }
        if (data.name) {
            searchFilters["name"] = { $regex: data.name, $options: "i" };
        }
        let sortRecord = { name: 1 };
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
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord = {}
            sortRecord[sortBy] = sortType;
        }
        let DonationCategory = await donationCategorySchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < DonationCategory.length; index++) {
            const createdAt = DonationCategory[index].createdAt;
            const updatedAt = DonationCategory[index].updatedAt;
            combineResponse.push(
                {
                    ...DonationCategory[index].toObject(),
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        if (DonationCategory.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countDonationCategory,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                response: []
            })
        }


    },
    editDonationCategory: async function (data, callback) {
        var obj = data.options;
        var answer = 0
        var answer_key = 0;
        var counter = 0;
        if (data) {
            donationCategorySchema.update(
                { _id: data._id },
                {
                    $set: {
                        name: data.name,
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
    },
    deleteDonationCategory: async function (data, callback) {
        if (data) {
            donationCategorySchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    requestDonation: async function (data, callback) {
        if (data) {

            new donationSchema(data).save(function(err, result) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Error.",
                        response: err
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted successfully.",
                        response: {id: result._id}
                    });
                }
            });
        }
    },
    listDonation: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];

        if (data.searchTerm) {
            searchArray.push({ 'fullName': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }
        var qry = { $or: searchArray };
        donationSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countDonation = await donationSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["name"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id && data._id != '-1') {
            searchFilters["_id"] = data._id;
        }
        if (data.name) {
            searchFilters["name"] = { $regex: data.name, $options: "i" };
        }
        let sortRecord = { createdAt: -1 };
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
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord = {}
            sortRecord[sortBy] = sortType;
        }
        let Donation = await donationSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < Donation.length; index++) {
            const categoryId = Donation[index].categoryId;
            let DonationCategory = await donationCategorySchema.findOne({ _id: categoryId });

            combineResponse.push({ ...Donation[index].toObject(), categoryName: DonationCategory.name })

        }
        if (Donation.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countDonation,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                response: []
            })
        }


    },
    deleteDonation: async function (data, callback) {
        if (data) {
            donationSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    viewDonation: async function (data, callback) {
        if (data) {
            donationSchema.findOne({ _id: data.donationId })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        data: r
                    });
                })
        }
    },
    updateTranscctionDonation: async function (data, callback) {
        if (data) {
            donationSchema.update(
                { _id: data.donationId },
                {
                    $set: {
                        transactionId: data.transactionId
                    }
                }
            ).then(r => {

                donationSchema.findOne({_id: data.donationId}).then(res => {
                    donationCategorySchema.findOne({_id: res.categoryId}).then(r => {
                        var mailData = {
                            fullName: res.fullName,
                            amount: res.amount,
                            unit: res.unit,
                            donationCategoryName: r.name,
                            donationMesssage: r.message,
                            site_url: config.liveUrl,
                            date: new Date(),
                            logo: config.liveUrl + '' + config.siteConfig.LOGO,
                            site_color: config.siteConfig.SITECOLOR,
                            site_name: config.siteConfig.SITENAME
                        }
                        mailProperty('donationMail')(res.email, mailData).send();
                        callback({
                            success: true,
                            STATUSCODE: 2000,
                            message: "Success"
                        });
                    })
                    
                })
            })
        }
    },
}
module.exports = donationModel;