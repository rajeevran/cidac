var config = require('../../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var ObjectID = mongo.ObjectID;
var Admin = require('../../schema/admin/admin');
var Stripe = require('stripe')(config.stripe.apiKey);

//======================MONGO MODELS============================
var DonationModel = require('../../models/admin/DonationModel');
//======================Module============================
var mailProperty = require('../../modules/sendMail');

var donation = {
    addDonationCategory: function (adminData, callback) {
        DonationModel.addDonationCategory(adminData, function (res) {
            callback(res);
        })
    },
    listDonationCategory: function (adminData, callback) {
        DonationModel.listDonationCategory(adminData, function (res) {
            callback(res);
        })
    },
    editDonationCategory: function (adminData, callback) {
        DonationModel.editDonationCategory(adminData, function (res) {
            callback(res);
        })
    },
    deleteDonationCategory: function (adminData, callback) {
        DonationModel.deleteDonationCategory(adminData, function (res) {
            callback(res);
        })
    },
    requestDonation: function (adminData, callback) {
        DonationModel.requestDonation(adminData, function (res) {
            if (res.STATUSCODE == 2000) {
                if (adminData.email != '' && adminData.email != null && adminData.email != undefined) {
                    mailProperty('requestDonation')(config.ADMINMAIL, {
                        name: adminData.fullName,
                        email: adminData.email,
                        amount: adminData.amount,
                        unit: adminData.unit,
                        address: adminData.address,
                        comment: adminData.comment,
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
    listDonation: function (adminData, callback) {
        DonationModel.listDonation(adminData, function (res) {
            callback(res);
        })
    },
    deleteDonation: function (adminData, callback) {
        DonationModel.deleteDonation(adminData, function (res) {
            callback(res);
        })
    },
    paymentDonation: function (adminData, callback) {
        DonationModel.viewDonation(adminData, function (res) {
            if (res.STATUSCODE == 2000) {
                Stripe.tokens.create(
                    {
                        card: {
                            exp_month: adminData.exp_month,
                            exp_year: adminData.exp_year,
                            number: adminData.number,
                            cvc: adminData.cvc
                        },
                    },
                    function (err, token) {
                        if (err) {
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: err.raw.message,
                                response: err
                            });
                        } else {
                            var card_token = token.id;
                            Stripe.charges.create({
                                amount: parseFloat(res.data.amount * 100),
                                currency: res.data.unit,
                                source: card_token,
                                description: res.data.fullName
                            }).then(function (charge) {
                                if (!charge) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 4200,
                                        message: err.raw.message,
                                        response: err
                                    });
                                } else {
                                    adminData.transactionId = charge.balance_transaction;
                                    DonationModel.updateTranscctionDonation(adminData,function(result){
                                        callback(result);
                                    });
                                }
                            })
                        }
                    }
                );
            } else {
                callback(res);
            }
        })
    }
}
module.exports = donation;