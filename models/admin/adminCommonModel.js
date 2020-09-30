
var AdminSchema = require('../../schema/admin/admin');
var NewsSchema = require('../../schema/admin/news');
var MasjidSchema = require('../../schema/admin/masjid');
var NewsCategorySchema = require('../../schema/admin/newsCategory');
var ServiceProviderSchema = require('../../schema/admin/serviceProvider');
var ServiceProviderCategorySchema = require('../../schema/admin/serviceProviderCategory');
var IslamicRadioSchema = require('../../schema/admin/islamicradio');
const fetch = require('node-fetch');

//let liveUrl = require("../../config");
var CitySchema = require('../../schema/admin/city');
var AdvertisementSchema = require('../../schema/admin/advertisement');
var PrayerSchema = require('../../schema/admin/prayer');
var AboutIslamSchema = require('../../schema/admin/islam');
var AboutUsSchema = require('../../schema/admin/aboutus');
var PillerOfIslamSchema = require('../../schema/admin/pillerofislam');
var AnnouncementSchema = require('../../schema/admin/announcement');
var DeviceSchema = require('../../schema/admin/device');
var PushNotificationSchema = require('../../schema/admin/pushNotification');
var FaqSchema = require('../../schema/admin/faq');

const axios = require('axios')
const moment = require('moment')


var TermSchema = require('../../schema/admin/term');

var PolicySchema = require('../../schema/admin/policy');

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

async function getLatLong(lat, long) {
    let [googleCityDetails] = await Promise.all([

        fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + lat + ',' + long + '&key=AIzaSyAe7ZL3el97Fsw7DGmDrEKBnOwDgBzURXs&sensor=false')
            .then(res => res.json())
    ]);

    var city = ''

    if (typeof googleCityDetails.results[0] != "undefined") {

        if (googleCityDetails.results[0].address_components !== undefined) {

            let filterData = googleCityDetails.results[0].address_components.filter(

                gcity => gcity.types[0] == "locality"
            )

            if (filterData.length > 0) {
                city = filterData[0].long_name

            } else {

                city = ''

            }
        }
    }

    return city
}


/** Generate Random passowrd */
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

var commonModel = {
    authenticate: function (jwtData, callback) {
        if (jwtData["x-access-token"]) {
            jwt.verify(jwtData["x-access-token"], config.secretKey, function (err, decoded) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Session timeout! Please login again.",
                        response: err
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Authenticate successfully.",
                        response: decoded
                    });
                }
            });
        }
    },
    updateDeviceToken: function (data, callback) {
        if (data) {
            /** Check device is already registered or not */
            DeviceSchema.countDocuments({ deviceToken: data.deviceToken }, function (err, count) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Error.",
                        response: {}
                    });
                } else {
                    if (count) {
                        DeviceSchema.updateOne({ deviceToken: data.deviceToken },
                            {
                                $set: { cityId: data.cityId }
                            }, function (err, res) {
                                callback({
                                    success: false,
                                    STATUSCODE: 2000,
                                    message: "Device token updated",
                                    response: {}
                                });
                            })
                    } else {
                        new DeviceSchema(data)
                            .save(function (err, r) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 4200,
                                        message: "Error.",
                                        response: {}
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Submitted successfully.",
                                        response: {}
                                    });
                                }
                            })

                    }
                }
            })

        } else {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "Error.",
                response: {}
            });
        }
    },
    addNotification: async function (data, callback) {
        if (data) {
            await new PushNotificationSchema(data)
                .save(function (err, r) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "Error.",
                            response: {}
                        });
                    } else {
                        callback({
                            success: true,
                            STATUSCODE: 2000,
                            message: "Submitted successfully.",
                            response: r
                        });
                    }
                })

        } else {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "Error.",
                response: {}
            });
        }
    },
    getDeviceToken: function (data, callback) {
        if (data) {
            DeviceSchema.find(
                { cityId: data.cityId }
            ).exec(function (err, result) {
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
                        message: "Device list.",
                        response: result
                    });
                }
            })
        }
    },
    //#region news
    addNewsModel: async function (data, callback) {
        if (data) {

            new NewsSchema(data).save(function (err, result) {
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
                        response: result
                    });
                }
            })

        }
    },
    listNewsModel: async function (data, callback) {
        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'title': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }

        if (data.adminCity) {
            searchArray.push({
                'cityId': { $in: data.adminCity }
            });
        }

        if (data.searchCity) {
            searchArray.push({
                'cityId': data.searchCity
            });
        }

        if (searchArray.length > 0) {
            qry = { $and: searchArray };
        }

        let countNews = 0;
        NewsSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countNews = resCount;
            }
        })
        //let countNews = await NewsSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["title"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data.categoryId && data.categoryId != '-1') {
            searchFilters["categoryId"] = data.categoryId;
        }
        if (data._id) {
            searchFilters["_id"] = data._id;
        }
        if (data.title) {
            searchFilters["title"] = { $regex: data.title, $options: "i" };
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = 1;
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }
        /** Super admin search by city */
        if (data.searchCity) {
            searchFilters["cityId"] = data.searchCity;
        }

        let news = await NewsSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();

        for (let index = 0; index < news.length; index++) {
            const categoryId = news[index].categoryId;
            const cityId = news[index].cityId;
            const createdAt = news[index].createdAt;
            const updatedAt = news[index].updatedAt;
            let newsCategory = await NewsCategorySchema.findOne({ _id: categoryId })
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...news[index].toObject(),
                    categoryName: newsCategory !== null ? newsCategory.name : '',
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let newsCountFiltered = await NewsSchema.find(searchFilters)
        if (news.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countNews,
                filteredData: newsCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }
        //#endregion old data  
    },
    editNewsModel: async function (data, callback) {
        NewsSchema.findOne({ _id: data._id })
            .then(async ven => {
                if (ven) {
                    if (data) {
                        NewsSchema.updateOne(
                            { _id: data._id },
                            {
                                $set: {
                                    image: data.image ? data.image : ven.image,
                                    title: data.title,
                                    categoryId: data.categoryId,
                                    description: data.description,
                                    cityId: data.cityId
                                }
                            }
                        ).then(async r => {
                            let NewsDetails = await NewsSchema.find({ _id: data._id })
                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                message: "Success",
                                response: NewsDetails

                            });
                        }).catch(err => {
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: "Error Occur during Edit",
                                response: err

                            });
                        })
                    }
                }
            });
    },
    deleteNewsModel: async function (data, callback) {
        if (data) {
            NewsSchema.deleteOne({ _id: data._id })
                .then(async r => {
                    await PushNotificationSchema.deleteMany({ objId: data._id });
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllNewsModel: async function (data, callback) {
        var combineResponse = [];
        NewsSchema.find({ cityId: data.cityId }).sort({ createdAt: 'desc' }).limit(5).exec()
            .then(async res => {
                if (res.length > 0) {
                    for (let index = 0; index < res.length; index++) {
                        const categoryId = res[index].categoryId;
                        const createdAt = res[index].createdAt;
                        const updatedAt = res[index].updatedAt;
                        let resCategory = await NewsCategorySchema.findOne({ _id: categoryId })
                        combineResponse.push(
                            {
                                ...res[index].toObject(),
                                categoryName: resCategory.name,
                                formatedCreatedAt: moment(createdAt).format('LL'),
                                formatedUpdatedAt: moment(updatedAt).format('LL')
                            }
                        )
                    }
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: combineResponse
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No News Found",
                        response: []
                    });

                }
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
    //#endregion news

    //#region news category
    addNewsCategoryModel: async function (data, callback) {
        if (data) {
            var newsSchema = {
                name: data.name
            }
            new NewsCategorySchema(newsSchema)
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
    listNewsCategoryModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }

        var qry = { $or: searchArray };

        NewsCategorySchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countNewsCategory = await NewsCategorySchema.countDocuments().exec()

        //   let news = await NewsCategorySchema.find({})
        //     .skip(data.offset).limit(data.limit)

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

        //#region Set pagination and sorting===============================================
        //=======(common Params[pageindex=1&pagesize=10&sortby=name&sorttype=Asc])
        let sortRecord = { _id: 1 };
        let pageIndex = 1;

        let pageSize = parseInt(config.limit);
        let limitRecord = pageSize;
        let skipRecord = 0;
        //pageSize, pageIndex, sortBy, sortType, lat, long
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


        let NewsCategory = await NewsCategorySchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();



        for (let index = 0; index < NewsCategory.length; index++) {
            const createdAt = NewsCategory[index].createdAt;
            const updatedAt = NewsCategory[index].updatedAt;
            combineResponse.push(
                {
                    ...NewsCategory[index].toObject(),
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )

        }

        if (NewsCategory.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countNewsCategory,
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
    editNewsCategoryModel: async function (data, callback) {
        if (data) {
            NewsCategorySchema.update(
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
    deleteNewsCategoryModel: async function (data, callback) {
        if (data) {
            NewsCategorySchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllNewsCategoryModel: async function (data, callback) {
        NewsCategorySchema.find()
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
    //#endregion news category

    //#region service provider
    addServiceProviderModel: async function (data, callback) {
        if (data) {
            new ServiceProviderSchema(data).save(function (err, result) {
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
                        response: result
                    });
                }
            });

        }
    },
    listServiceProviderModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        var combineBannerResponse = [];
        var qry = {};
        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }

        if (data.adminCity) {
            searchArray.push({
                'cityId': { $in: data.adminCity }
            });
        }

        if (data.searchCity) {
            searchArray.push({
                'cityId': data.searchCity
            });
        }

        if (searchArray.length > 0) {
            qry = { $and: searchArray };
        }

        let countServiceProvider = 0;

        ServiceProviderSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countServiceProvider = resCount;
            }
        })
        // let countServiceProvider = await ServiceProviderSchema.countDocuments(qry).exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["name"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data.categoryId && data.categoryId != '-1') {
            searchFilters["categoryId"] = data.categoryId;
        }
        if (data._id) {
            searchFilters["_id"] = data._id;
        }
        if (data.name) {
            searchFilters["name"] = { $regex: data.name, $options: "i" };
        }
        if (data.address) {
            searchFilters["address"] = { $regex: data.address, $options: "i" };
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }

        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false;
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }

        /** Super admin search by city */
        if (data.searchCity) {
            searchFilters["cityId"] = data.searchCity;
        }

        let ServiceProviderList = await ServiceProviderSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();

        for (let index = 0; index < ServiceProviderList.length; index++) {
            const categoryId = ServiceProviderList[index].categoryId;
            const cityId = ServiceProviderList[index].cityId;
            const createdAt = ServiceProviderList[index].createdAt;
            const updatedAt = ServiceProviderList[index].updatedAt;
            let ServiceProviderListCategory = await ServiceProviderCategorySchema.findOne({ _id: categoryId })
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push({
                ...ServiceProviderList[index].toObject(),
                categoryName: ServiceProviderListCategory.name,
                cityName: city !== null ? city.name : '',
                formatedCreatedAt: moment(createdAt).format('LL'),
                formatedUpdatedAt: moment(updatedAt).format('LL'),
                type: 'service',
            })
        }
        let newsCountFiltered = await ServiceProviderSchema.find(searchFilters)
        let BannerList = await AdvertisementSchema.find(
            {
                cityId: data.cityId,
                imageStatus: true,
                page: 'serviceprovider'
            }
        )
            .exec();
        for (let index = 0; index < BannerList.length; index++) {
            const cityId = BannerList[index].cityId;
            const createdAt = BannerList[index].createdAt;
            let city = await CitySchema.findOne({ _id: cityId })
            combineBannerResponse.push({
                ...BannerList[index].toObject(),
                cityName: city !== null ? city.name : '',
                formatedCreatedAt: moment(createdAt).format('LL'),
                type: 'banner',
            })
        }
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countServiceProvider,
            filteredData: newsCountFiltered.length,
            response: combineResponse,
            banner: combineBannerResponse

        })

    },
    editServiceProviderModel: async function (data, callback) {
        ServiceProviderSchema.findOne({ _id: data._id })
            .then(async ven => {
                if (ven) {
                    if (data.image) {
                        file_with_path = `./public/${ven.image}`;
                    }
                    if (data) {
                        ServiceProviderSchema.update(
                            { _id: data._id },
                            {
                                $set: {
                                    categoryId: data.categoryId,
                                    name: data.name,
                                    companyName: data.companyName,
                                    companyWebsite: data.companyWebsite,
                                    contact: data.contact,
                                    image: data.image,
                                    description: data.description,
                                    address: data.address,
                                    cityId: data.cityId
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
            });
    },
    deleteServiceProviderModel: async function (data, callback) {
        if (data) {
            ServiceProviderSchema.deleteOne({ _id: data._id })
                .then(async r => {
                    await PushNotificationSchema.deleteMany({ objId: data._id });
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllServiceProviderModel: async function (data, callback) {
        var combineResponse = [];
        ServiceProviderSchema.find({ cityId: data.cityId }).sort({ createdAt: 'desc' }).limit(5)
            .then(async res => {
                if (res.length > 0) {
                    for (let index = 0; index < res.length; index++) {
                        const categoryId = res[index].categoryId;
                        let resCategory = await ServiceProviderCategorySchema.findOne({ _id: categoryId })
                        combineResponse.push({ ...res[index].toObject(), categoryName: resCategory.name })
                    }
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: combineResponse
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No Service Found",
                        response: []
                    });

                }
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
    //#endregion service provider

    //#region service provider category
    addServiceProviderCategoryModel: async function (data, callback) {
        if (data) {
            var newsSchema = {
                name: data.name,
                description: data.description
            }
            new ServiceProviderCategorySchema(newsSchema)
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
    listServiceProviderCategoryModel: async function (data, callback) {
        console.log('data',data);
        var searchArray = [];
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }

        var qry = { $or: searchArray };

        ServiceProviderCategorySchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countServiceProviderCategory = await ServiceProviderCategorySchema.countDocuments().exec()

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
        if (data.description) {
            searchFilters["description"] = { $regex: data.description, $options: "i" };
        }


        //#region Set pagination and sorting
        let sortRecord = { updatedAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false;
        if (checkIsadmin == true) {
            var limitRecord = data.limit;
            var skipRecord = data.offset;
        } else {
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
                skipRecord = pageIndex//(pageIndex - 1) * pageSize;
            }
            limitRecord = pageSize;
        }
        // let pageIndex = 1;
        // let pageSize = parseInt(config.limit);
        // let limitRecord = pageSize;
        // let skipRecord = 0;
        // if (data.pageSize) {
        //     pageSize = parseInt(data.pageSize);
        // }
        // if (data.pageIndex) {
        //     pageIndex = parseInt(data.pageIndex);
        // }
        // if (pageIndex > 1) {
        //     skipRecord = pageIndex//(pageIndex - 1) * pageSize;
        // }
        // limitRecord = pageSize;
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            //sortRecord = {}
            sortRecord[sortBy] = sortType;
        }


        let serviceProviderCategory = await ServiceProviderCategorySchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();



        for (let index = 0; index < serviceProviderCategory.length; index++) {
            const createdAt = serviceProviderCategory[index].createdAt;
            const updatedAt = serviceProviderCategory[index].updatedAt;
            combineResponse.push(
                {
                    ...serviceProviderCategory[index].toObject(),
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )

        }

        let serviceProviderCategoryCountFiltered = await ServiceProviderCategorySchema.find(searchFilters)


        if (serviceProviderCategory.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countServiceProviderCategory,
                filteredData: serviceProviderCategoryCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }



    },
    editServiceProviderCategoryModel: async function (data, callback) {
        if (data) {
            ServiceProviderCategorySchema.update(
                { _id: data._id },
                {
                    $set: {
                        name: data.name,
                        description: data.description
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
    deleteServiceProviderCategoryModel: async function (data, callback) {
        if (data) {
            ServiceProviderCategorySchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllServiceProviderCategoryModel: async function (data, callback) {
        ServiceProviderCategorySchema.find()
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
    //#endregion service provider category

    //#region Masjid
    addMasjidModel: async function (data, callback) {
        if (data) {
            data.officeHrs = JSON.parse(data.officeHrs);
            data.scheduleOfficeHrs = JSON.parse(data.scheduleOfficeHrs);
            new MasjidSchema(data).save(function (err, result) {
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
                        response: result
                    });
                }
            })

        }
    },
    listMasjidModel: async function (data, callback) {
        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'name': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }

        if (data.adminCity) {
            searchArray.push({
                'cityId': { $in: data.adminCity }
            });
        }

        if (data.searchCity) {
            searchArray.push({
                'cityId': data.searchCity
            });
        }

        if (searchArray.length > 0) {
            qry = { $and: searchArray };
        }

        let countMasjid = 0;

        MasjidSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countMasjid = resCount;
            }
        })
        // let countMasjid = await MasjidSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["name"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id) {
            searchFilters["_id"] = data._id;
        }
        if (data.name) {
            searchFilters["name"] = { $regex: data.name, $options: "i" };
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false

        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }

        /** Super admin search by city */
        if (data.searchCity) {
            searchFilters["cityId"] = data.searchCity;
        }

        let masjid = await MasjidSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < masjid.length; index++) {
            const cityId = masjid[index].cityId;
            const createdAt = masjid[index].createdAt;
            const updatedAt = masjid[index].updatedAt;
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...masjid[index].toObject(),
                    images: masjid[index].image,
                    image: masjid[index].image[0],
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL'),
                }
            )
        }
        let masjidCountFiltered = await MasjidSchema.find(searchFilters)
        if (masjid.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countMasjid,
                filteredData: masjidCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }
        //#endregion old data 
    },
    editMasjidModel: async function (data, callback) {
        var obj = data.options;
        data.officeHrs = JSON.parse(data.officeHrs)
        MasjidSchema.findOne({ _id: data._id })
            .then(async ven => {
                if (ven) {
                    if (data.image) {
                        file_with_path = `./public/${ven.image}`;
                    }
                    if (data) {
                        MasjidSchema.update(
                            { _id: data._id },
                            {
                                $set: {
                                    name: data.name,
                                    establishmentDate: data.establishmentDate,
                                    address: data.address,
                                    officeHrs: data.officeHrs,
                                    image: data.image,
                                    cityId: data.cityId,
                                    description: data.description,
                                    scheduleOfficeHrs: JSON.parse(data.scheduleOfficeHrs)
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
            });
    },

    deleteMasjidModel: async function (data, callback) {
        if (data) {

            MasjidSchema.deleteOne({ _id: data._id })
                .then(async r => {
                    await PushNotificationSchema.deleteMany({ objId: data._id });
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllMasjidModel: async function (data, callback) {
        var combineResponse = [];
        MasjidSchema.find({ cityId: data.cityId }).sort({ createdAt: 'desc' }).limit(5).exec()
            .then(res => {
                for (let index = 0; index < res.length; index++) {
                    const createdAt = res[index].createdAt;
                    const updatedAt = res[index].updatedAt;
                    const establishmentDate = res[index].establishmentDate;
                    combineResponse.push(
                        {
                            ...res[index].toObject(),
                            images: res[index].image,
                            image: res[index].image[0],
                            formatedCreatedAt: moment(createdAt).format('LL'),
                            formatedEstablishmentDate: moment(establishmentDate).format('LL'),
                            formatedUpdatedAt: moment(updatedAt).format('LL')
                        }
                    )
                }
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: combineResponse
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No Announcement Found",
                        response: []
                    });

                }
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
    //#endregion Masjid

    //#region Advertisement
    addAdvertisementModel: function (data, callback) {
        if (data) {
            data.imageStatus = true;
            let pages = data.page.split(',');
            async.times(pages.length, function (n, next) {
                data.page = pages[n];
                new AdvertisementSchema(data)
                    .save(r => {
                        if (n === pages.length - 1) {
                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                message: "Submitted successfully.",
                                response: r
                            });
                        }

                    })
            })

        }
    },
    listAdvertisementModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        var qry = {};
        if (data.searchTerm) {
            searchArray.push({ 'page': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }

        if (data.adminCity) {
            searchArray.push({
                'cityId': { $in: data.adminCity }
            });
        }

        if (data.searchCity) {
            searchArray.push({
                'cityId': data.searchCity
            });
        }


        if (searchArray.length > 0) {
            qry = { $and: searchArray };
        }

        let countAdvertisement = 0;
        AdvertisementSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countAdvertisement = resCount;
            }
        })
        // let countAdvertisement = await AdvertisementSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["page"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id && data._id != '-1') {
            searchFilters["_id"] = data._id;
        }
        if (data.page) {
            searchFilters["page"] = { $regex: data.page, $options: "i" };
        }
        if (data.imageStatus === false) {
            searchFilters["imageStatus"] = data.imageStatus;
        }
        if (data.imageStatus === true) {
            searchFilters["imageStatus"] = data.imageStatus;
        }
        if (data.address) {
            searchFilters["address"] = { $regex: data.address, $options: "i" };
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false;
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }

        /** Super admin search by city */
        if (data.searchCity) {
            searchFilters["cityId"] = data.searchCity;
        }

        let advertisement = await AdvertisementSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < advertisement.length; index++) {
            const cityId = advertisement[index].cityId;
            const createdAt = advertisement[index].createdAt;
            const updatedAt = advertisement[index].updatedAt;
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...advertisement[index].toObject(),
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let advertisementCountFiltered = await AdvertisementSchema.find(searchFilters)
        if (advertisement.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countAdvertisement,
                filteredData: advertisementCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }

    },
    editAdvertisementModel: async function (data, callback) {
        AdvertisementSchema.findOne({ _id: data._id })
            .then(async ven => {
                if (ven) {
                    if (data.image) {
                        file_with_path = `./public/${ven.image}`;
                    }
                    if (data) {
                        AdvertisementSchema.update(
                            { _id: data._id },
                            {
                                $set: {
                                    page: data.page,
                                    image: data.image,
                                    link: data.link,
                                    address: data.address,
                                    cityId: data.cityId
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
            });
    },
    deleteAdvertisementModel: async function (data, callback) {
        if (data) {
            AdvertisementSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    editBannerStatusModel: async function (data, callback) {
        if (data) {
            AdvertisementSchema.update(
                { _id: data._id },
                {
                    $set: {
                        imageStatus: data.imageStatus,
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
    getAllAdvertisementModel: async function (data, callback) {
        AdvertisementSchema.find({ cityId: data.cityId, page: data.page }).sort({ createdAt: 'desc' })
            .then(res => {
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: res
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No Announcement Found",
                        response: []
                    });
                }
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
    //#endregion Advertisement

    //#region AboutIslam
    addAboutIslamModel: async function (data, callback) {
        if (data) {
            var qaSchema = {
                description: data.description
            }
            new AboutIslamSchema(qaSchema)
                .save(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted test successfully.",
                        response: r
                    });
                })
        }
    },
    listAboutIslamModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        var qry = {};
        if (data.searchTerm) {
            searchArray.push({ 'description': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }
        if (searchArray.length > 0) {
            qry = { $or: searchArray };
        }
        AboutIslamSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countAboutIslam = await AboutIslamSchema.countDocuments(qry).exec()
        let AboutIslam = await AboutIslamSchema.findOne(qry)
            .skip(data.offset).limit(data.limit)
        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countAboutIslam,
            response: AboutIslam
        })
    },
    editAboutIslamModel: async function (data, callback) {
        if (data) {
            AboutIslamSchema.update(
                { _id: data._id },
                {
                    $set: {

                        description: data.description
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
    deleteAboutIslamModel: async function (data, callback) {
        if (data) {
            AboutIslamSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllAboutIslamModel: async function (data, callback) {
        AboutIslamSchema.findOne({})
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
    //#endregion AboutIslam

    //#region AboutUs
    addAboutUsModel: async function (data, callback) {
        if (data) {
            var qaSchema = {

                description: data.description
            }

            new AboutUsSchema(qaSchema)
                .save(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted test successfully.",
                        response: r
                    });
                })


        }
    },
    listAboutUsModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];

        if (data.searchTerm) {
            searchArray.push({ 'description': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }

        var qry = { $or: searchArray };

        AboutUsSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countAboutUs = await AboutUsSchema.countDocuments(qry).exec()


        let qaCategory = await AboutUsSchema.findOne(qry)
            .skip(data.offset).limit(data.limit)

        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countAboutUs,
            response: qaCategory
        })



    },
    editAboutUsModel: async function (data, callback) {
        var obj = data.options;

        var answer = 0
        var answer_key = 0;
        var counter = 0;

        if (data) {
            AboutUsSchema.update(
                { _id: data._id },
                {
                    $set: {

                        description: data.description
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
    deleteAboutUsModel: async function (data, callback) {
        var obj = data.options;

        var answer = 0
        var answer_key = 0;
        var counter = 0;

        if (data) {
            AboutUsSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllAboutUsModel: async function (data, callback) {

        AboutUsSchema.findOne()
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
    //#endregion AboutUs

    //#region PillerOfIslam
    addPillerOfIslamModel: async function (data, callback) {

        if (data) {

            var qaSchema = {

                description: data.description
            }

            new PillerOfIslamSchema(qaSchema)
                .save(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted test successfully.",
                        response: r
                    });
                })


        }
    },
    listPillerOfIslamModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];

        if (data.searchTerm) {
            searchArray.push({ 'description': new RegExp(data.searchTerm, 'i') });
        }
        else {
            searchArray.push({})
        }

        var qry = { $or: searchArray };

        PillerOfIslamSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })

        let countPillerOfIslam = await PillerOfIslamSchema.countDocuments(qry).exec()


        let qaCategory = await PillerOfIslamSchema.findOne(qry)
            .skip(data.offset).limit(data.limit)

        callback({
            success: true,
            STATUSCODE: 2000,
            message: "Success",
            totalData: countPillerOfIslam,
            response: qaCategory
        })



    },
    editPillerOfIslamModel: async function (data, callback) {
        var obj = data.options;

        var answer = 0
        var answer_key = 0;
        var counter = 0;

        if (data) {
            PillerOfIslamSchema.update(
                { _id: data._id },
                {
                    $set: {

                        description: data.description
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
    deletePillerOfIslamModel: async function (data, callback) {
        var obj = data.options;

        var answer = 0
        var answer_key = 0;
        var counter = 0;

        if (data) {
            PillerOfIslamSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllPillerOfIslamModel: async function (data, callback) {

        PillerOfIslamSchema.findOne()
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
    //#endregion PillerOfIslam

    //#region Announcement
    addAnnouncementModel: async function (data, callback) {
        if (data) {
            new AnnouncementSchema(data)
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
    listAnnouncementModel: async function (data, callback) {
        var searchArray = [];
        var combineResponse = [];
        var qry = {};
        if (data.searchTerm) {
            searchArray.push({ 'description': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }
        if (data.announcementStatus != undefined && data.announcementStatus != null && data.announcementStatus != '') {
            searchArray.push({
                'announcementStatus': data.announcementStatus
            });
        }
        if (searchArray.length > 0) {
            qry = { $or: searchArray };
        }
        AnnouncementSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countAnnouncement = await AnnouncementSchema.countDocuments().exec()
        let searchFilters = {};

        if (data.searchTerm) {
            searchFilters["description"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id && data._id != '-1') {
            searchFilters["_id"] = data._id;
        }
        if (data.description) {
            searchFilters["description"] = { $regex: data.description, $options: "i" };
        }
        if (data.announcementStatus != undefined && data.announcementStatus != null && data.announcementStatus != '') {
            searchFilters["announcementStatus"] = data.announcementStatus;
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        if (checkIsadmin == true) {
            var limitRecord = data.limit;
            var skipRecord = data.offset;
        } else {
            var limitRecord = countAnnouncement;
            var skipRecord = 0
        }

        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }
        let announcement = await AnnouncementSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < announcement.length; index++) {
            const createdAt = announcement[index].createdAt;
            const updatedAt = announcement[index].updatedAt;
            const cityId = announcement[index].cityId;
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...announcement[index].toObject(),
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let announcementCountFiltered = await AnnouncementSchema.find(searchFilters)
        if (announcement.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countAnnouncement,
                filteredData: announcementCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }
    },
    editAnnouncementModel: async function (data, callback) {
        if (data) {
            AnnouncementSchema.update(
                { _id: data._id },
                {
                    $set: {
                        announcementStatus: data.announcementStatus,
                        cityId: data.cityId,
                        description: data.description
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
    deleteAnnouncementModel: async function (data, callback) {
        if (data) {
            AnnouncementSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllAnnouncementModel: async function (data, callback) {
        AnnouncementSchema.find({ cityId: data.cityId }).sort({ createdAt: 'desc' })
            .then(res => {
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: res
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No Announcement Found",
                        response: []
                    });
                }
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
    editAnnouncementStatusModel: async function (data, callback) {
        if (data.announcementStatus === true) {
            data.announcementStatus = true
        }
        else {
            data.announcementStatus = false
        }

        if (data) {
            AnnouncementSchema.update(
                { _id: data._id },
                {
                    $set: {
                        announcementStatus: data.announcementStatus
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
    //#endregion Announcement

    //#region Prayer
    addPrayerModel: async function (data, callback) {
        if (data) {
            let insertableData = data.filter(e => e.date !== '');
            if (insertableData.length) {
                async.times(insertableData.length, function (n, next) {
                    new PrayerSchema(insertableData[n]).save((err, result) => {
                        if (err) {
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: "Error.",
                                response: err
                            });
                        } else {
                            if (n === (insertableData.length - 1)) {
                                callback({
                                    success: true,
                                    STATUSCODE: 2000,
                                    message: "Submitted successfully.",
                                    response: {}
                                });
                            }
                        }
                    });

                }, function (err, result) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "Error.",
                            response: err
                        })
                    } else {
                        callback(result);
                    }

                });

            }
        }
    },
    listPrayerModel: async function (data, callback) {
        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'date': new RegExp(data.searchTerm, 'i') });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }

        if (data.adminCity) {
            searchArray.push({
                'cityId': { $in: data.adminCity }
            });
        }

        if (searchArray.length === 0) {

            if (data.searchStartDate && data.searchEndDate && data.searchCity) {
                qry = {
                    'date': { $gte: data.searchStartDate, $lt: data.searchEndDate },
                    'cityId': data.searchCity
                };
            }

        }
        if (searchArray.length > 0) {
            if (data.searchStartDate && data.searchEndDate) {
                qry = {
                    $and: [
                        { $or: [{ 'date': { $gte: data.searchStartDate, $lt: data.searchEndDate } }] },
                        { $or: searchArray }
                    ]
                };
            } else {
                qry = { $or: searchArray };
            }

        }

        let countPrayer = 0;
        PrayerSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            } else {
                countPrayer = resCount;
            }
        })
        //let countPrayer = await PrayerSchema.countDocuments().exec()
        let searchFilters = {};

        if (data.searchTerm) {
            searchFilters["date"] = { $regex: data.searchTerm, $options: "i" };
        }
        if (data._id && data._id != '-1') {
            searchFilters["_id"] = data._id;
        }
        if (data.date) {
            searchFilters["date"] = { $regex: data.date, $options: "i" };
        }
        if (data.prayersSunrise) {
            searchFilters["prayersSunrise"] = { $regex: data.prayersSunrise, $options: "i" };
        }
        if (data.prayersSunset) {
            searchFilters["prayersSunset"] = { $regex: data.prayersSunset, $options: "i" };
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { date: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        if (checkIsadmin == true) {
            var limitRecord = data.limit;
            var skipRecord = data.offset;
        } else {
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
                skipRecord = pageIndex//(pageIndex - 1) * pageSize;
            }
            limitRecord = pageSize;
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }
        if (data.searchStartDate && data.searchEndDate) {
            searchFilters["date"] = { $gte: data.searchStartDate, $lt: data.searchEndDate };
        }
        if (data.searchCity) {
            searchFilters["cityId"] = data.searchCity;
        }



        let prayer = await PrayerSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();

        for (let index = 0; index < prayer.length; index++) {
            const cityId = prayer[index].cityId;
            const createdAt = prayer[index].createdAt;
            const updatedAt = prayer[index].updatedAt;
            let city = await CitySchema.findOne({ _id: cityId });
            combineResponse.push(
                {
                    ...prayer[index].toObject(),
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )

        }
        let prayerCountFiltered = await PrayerSchema.find(searchFilters)
        if (prayer.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countPrayer,
                filteredData: prayerCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }

    },
    editPrayerModel: async function (data, callback) {
        if (data) {
            /** check for duplicate date entry */
            PrayerSchema.countDocuments({ $and: [{ date: data.date }, { cityId: data.cityId }, { _id: { $ne: data._id } }] }, function (err, count) {
                if (count) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Entry for the date already exists"
                    });
                } else {
                    PrayerSchema.update(
                        { _id: data._id },
                        {
                            $set: {
                                date: data.date,
                                hijriDate: data.hijriDate,
                                fajrOpen: data.fajrOpen,
                                fajrIqamah: data.fajrIqamah,
                                zuhrOpen: data.zuhrOpen,
                                zuhrIqamah: data.zuhrIqamah,
                                dhuhrOpen: data.dhuhrOpen,
                                dhuhrIqamah: data.dhuhrIqamah,
                                maghribOpen: data.maghribOpen,
                                maghribIqamah: data.maghribIqamah,
                                ishaOpen: data.ishaOpen,
                                ishaIqamah: data.ishaIqamah,
                                sunrise: data.sunrise,
                                sunset: data.sunset,
                                cityId: data.cityId,
                                prayersSunrise: data.prayersSunrise,
                                prayersSunset: data.prayersSunset,
                                prayers: data.prayers
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

            })
        }
    },
    deletePrayerModel: async function (data, callback) {
        if (data) {
            PrayerSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllPrayerModel: async function (data, callback) {
        var todate = moment.utc(new Date()).local().format('YYYY-MM-DD');
        if (data.prayerDate) {
            todate = moment.utc(data.prayerDate).local().format('YYYY-MM-DD');
        }
        PrayerSchema.find(
            {
                // $and: [
                //     {"date": {$gte: new Date(new Date(todate).setDate(new Date(todate).getDate() + 1))}},
                //     {"date": {$lte: new Date(new Date(todate).setDate(new Date(todate).getDate() + 1))}}

                // ],
                "date": {
                    $gte: new Date(todate),
                    $lt: new Date(new Date(todate).setDate(new Date(todate).getDate() + 1))
                },
                cityId: data.cityId
            },
            {
                _id: 1,
                date: 1,
                hijriDate: 1,
                sunrise: 1,
                sunset: 1,
                cityId: 1,
                prayers: 1,
                prayersSunrise: 1,
                prayersSunset: 1,
                createdAt: 1,
                updatedAt: 1,
                v: 1
            }
        )
            .lean(true)
            .then(res => {
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: res
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No prayer in this date",
                        response: []
                    });
                }

            })
    },
    getPrayerByDateModel: async function (data, callback) {
        PrayerSchema.find(
            {
                "date": {
                    $gte: new Date(data.date),
                    $lt: new Date(new Date(data.date).setDate(new Date(data.date).getDate() + 1))
                },
                cityId: data.cityId
            },
            {
                _id: 1,
                date: 1,
                hijriDate: 1,
                sunrise: 1,
                sunset: 1,
                cityId: 1,
                prayers: 1,
                prayersSunrise: 1,
                prayersSunset: 1,
                createdAt: 1,
                updatedAt: 1,
                v: 1
            }
        )
            .lean(true)
            .then(res => {
                console.log('res', res);
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: res
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No prayer in this date",
                        response: []
                    });
                }

            })
    },
    //#endregion Prayer  

    //#region IslamicRadio
    addIslamicRadioModel: async function (data, callback) {
        if (data) {
            IslamicRadioSchema.findOne({ cityId: data.cityId })
                .then(async ven => {
                    if (ven) {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "You already added radio in this city.",
                            response: {}
                        });
                    } else {
                        new IslamicRadioSchema(data)
                            .save(r => {
                                callback({
                                    success: true,
                                    STATUSCODE: 2000,
                                    message: "Submitted successfully.",
                                    response: r
                                });
                            })
                    }

                });
        }
    },
    listIslamicRadioModel: async function (data, callback) {
        var searchArray = [];
        searchArray.push({})
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({
                'email': new RegExp(data.searchTerm, 'i')
            });
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }
        var qry = { $or: searchArray };
        IslamicRadioSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countIslamicRadio = await IslamicRadioSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["email"] = { $regex: data.searchTerm, $options: "i" };
        }
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
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
            skipRecord = pageIndex//(pageIndex - 1) * pageSize;
        }
        limitRecord = pageSize;
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }

        if (data.adminCity) {
            searchFilters["cityId"] = { $in: data.adminCity };
        }

        let islamicRadio = await IslamicRadioSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();
        for (let index = 0; index < islamicRadio.length; index++) {
            const createdAt = islamicRadio[index].createdAt;
            const updatedAt = islamicRadio[index].updatedAt;
            const cityId = islamicRadio[index].cityId;
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...islamicRadio[index].toObject(),
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let islamicRadioCountFiltered = await IslamicRadioSchema.find(searchFilters)
        if (islamicRadio.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countIslamicRadio,
                filteredData: islamicRadioCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }



    },
    editIslamicRadioModel: async function (data, callback) {
        IslamicRadioSchema.findOne({ _id: data._id })
            .then(async ven => {
                if (ven) {
                    if (data.radioFilePath) {
                        file_with_path = `./public/${ven.radioFilePath}`;
                    }
                    if (data) {
                        IslamicRadioSchema.update(
                            { _id: data._id },
                            {
                                $set: {
                                    radioFilePath: data.radioFilePath ? data.radioFilePath : ven.radioFilePath,
                                    cityId: data.cityId,
                                    email: data.email,
                                    phone: data.phone,
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
            });
    },
    deleteIslamicRadioModel: async function (data, callback) {
        if (data) {
            IslamicRadioSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },
    getAllIslamicRadioModel: async function (data, callback) {
        IslamicRadioSchema.find({ cityId: data.cityId }).limit(1).sort({ createdAt: 'desc' })
            .then(res => {
                if (res.length > 0) {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: res
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No Announcement Found",
                        response: []
                    });

                }

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
    //#endregion IslamicRadio

    getHomeModel: async function (data, callback) {
        if (data.cityId) {
            let rootUrl = config.liveUrl;
            let announcementsBody = { cityId: data.cityId };
            let prayerBody = { cityId: data.cityId, prayerDate: data.date };
            let newsBody = { cityId: data.cityId };
            let islamicradioBody = { cityId: data.cityId };
            let advertisementBody = { cityId: data.cityId, page: 'home' };
            let masjidBody = { cityId: data.cityId };
            let serviceproviderBody = { cityId: data.cityId, modules: 'ServiceProviderSchema' };

            const [announcementsDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-announcement', {
                    method: 'post',
                    body: JSON.stringify(announcementsBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [prayersDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-prayer', {
                    method: 'post',
                    body: JSON.stringify(prayerBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [newsDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-news', {
                    method: 'post',
                    body: JSON.stringify(newsBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [islamicradioDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-islamicradio', {
                    method: 'post',
                    body: JSON.stringify(islamicradioBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [advertisementDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-advertisement', {
                    method: 'post',
                    body: JSON.stringify(advertisementBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [masjidDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-masjid', {
                    method: 'post',
                    body: JSON.stringify(masjidBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            const [serviceproviderDetails] = await Promise.all([
                fetch(rootUrl + 'apiAdmin/get-all-serviceprovider', {
                    method: 'post',
                    body: JSON.stringify(serviceproviderBody),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(res => res.json())
            ]);

            let city = await CitySchema.findOne({ _id: data.cityId })

            if (announcementsDetails.response.length > 0) {
                for (let index = 0; index < announcementsDetails.response.length; index++) {
                    const createdAt = announcementsDetails.response[index].createdAt;
                    const updatedAt = announcementsDetails.response[index].updatedAt;
                    announcementsDetails.response[index] =
                    {
                        ...announcementsDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')

                    }
                }
            }

            if (prayersDetails.response.length > 0) {
                for (let index = 0; index < prayersDetails.response.length; index++) {
                    const createdAt = prayersDetails.response[index].createdAt;
                    const updatedAt = prayersDetails.response[index].updatedAt;
                    prayersDetails.response[index] =
                    {
                        ...prayersDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')
                    }
                }
            }

            if (newsDetails.response.length > 0) {
                for (let index = 0; index < newsDetails.response.length; index++) {
                    if (typeof newsDetails.response[index] != 'undefined') {
                        const createdAt = newsDetails.response[index].createdAt;
                        const updatedAt = newsDetails.response[index].updatedAt;
                        newsDetails.response[index] =
                        {
                            ...newsDetails.response[index],
                            cityName: city !== null ? city.name : '',
                            formatedCreatedAt: moment(createdAt).format('LL'),
                            formatedUpdatedAt: moment(updatedAt).format('LL')

                        }
                    }
                }
            }

            if (islamicradioDetails.response.length > 0) {
                for (let index = 0; index < islamicradioDetails.response.length; index++) {
                    const createdAt = islamicradioDetails.response[index].createdAt;
                    const updatedAt = islamicradioDetails.response[index].updatedAt;
                    islamicradioDetails.response[index] =
                    {
                        ...islamicradioDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')
                    }
                }
            }

            if (advertisementDetails.response.length > 0) {
                for (let index = 0; index < advertisementDetails.response.length; index++) {
                    const createdAt = advertisementDetails.response[index].createdAt;
                    const updatedAt = advertisementDetails.response[index].updatedAt;
                    advertisementDetails.response[index] =
                    {
                        ...advertisementDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')
                    }
                }
            }

            if (masjidDetails.response.length > 0) {
                for (let index = 0; index < masjidDetails.response.length; index++) {
                    const createdAt = masjidDetails.response[index].createdAt;
                    const updatedAt = masjidDetails.response[index].updatedAt;
                    masjidDetails.response[index] =
                    {
                        ...masjidDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')

                    }
                }

            }

            if (serviceproviderDetails.response.length > 0) {
                for (let index = 0; index < serviceproviderDetails.response.length; index++) {
                    const createdAt = serviceproviderDetails.response[index].createdAt;
                    const updatedAt = serviceproviderDetails.response[index].updatedAt;
                    serviceproviderDetails.response[index] =
                    {
                        ...serviceproviderDetails.response[index],
                        cityName: city !== null ? city.name : '',
                        formatedCreatedAt: moment(createdAt).format('LL'),
                        formatedUpdatedAt: moment(updatedAt).format('LL')
                    }
                }
            }
            //#endregion            
            var allApiResponse = {
                cityName: city !== null ? city.name : '',
                announcement: announcementsDetails.response,
                prayers: prayersDetails.response,
                news: newsDetails.response,
                islamicradio: islamicradioDetails.response,
                advertisement: advertisementDetails.response,
                masjid: masjidDetails.response,
                serviceprovider: serviceproviderDetails.response
            }
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                response: allApiResponse
            });

        } else {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "Please Provide city",
                response: {}
            });
        }

    },
    getTermsAndConditionsModel: async function (data, callback) {
        TermSchema.findOne({ "_id": "5db7dea3c10c6e2604712024" })
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
    editTermsAndConditionsModel: async function (data, callback) {

        if (data) {
            TermSchema.update(
                { "_id": data._id },
                {
                    $set: {
                        text: data.text,

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

    getPrivacyPolicyModel: async function (data, callback) {
        PolicySchema.findOne({ "_id": "5db7dea3c10c6e2604712028" })
            .then(res => {
                console.log('res', res)
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

    editPrivacyPolicyModel: async function (data, callback) {
        if (data) {
            PolicySchema.update(
                { "_id": data._id },
                {
                    $set: {
                        text: data.text,

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

    /** Get List of Push notification */
    listPushNotificationModel: async function (data, callback) {

        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchArray.push({
                'cityId': data.cityId
            });
        }
        PushNotificationSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countPush = await PushNotificationSchema.countDocuments().exec();
        let searchFilters = {};
        if (data.appType) {
            searchFilters["appType"] = data.appType;
        }

        if (data.deviceToken) {
            searchFilters["deviceToken"] = data.deviceToken;
        }
        if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
            searchFilters["cityId"] = data.cityId
        }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = 1;
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }
        let pushNotifications = await PushNotificationSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();

        for (let index = 0; index < pushNotifications.length; index++) {
            const cityId = pushNotifications[index].cityId;
            const createdAt = pushNotifications[index].createdAt;
            const updatedAt = pushNotifications[index].updatedAt;
            let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...pushNotifications[index].toObject(),
                    cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let pushCountFiltered = await PushNotificationSchema.find(searchFilters)
        if (pushNotifications.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countPush,
                filteredData: pushCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }

    },

    /** Push Notification Details */
    pushNotificationDetailsModel: async function (data, callback) {
        if (data.pushId) {
            await PushNotificationSchema.findOne({ '_id': data.pushId })
                .then(async res => {
                    var response = res.toObject();
                    response.masjidDetails = {};
                    response.announcementDetails = {};
                    response.serviceProviderDetails = {};
                    if (response.noti_type === 'MASJID') {
                        if (response.objId) {
                            response.masjidDetails = await this.getMasjidDetails(response);
                        }
                    } else if (response.noti_type === 'NEWS') {
                        if (response.objId) {
                            response.announcementDetails = await this.getAnnouncementDetails(response);
                        }

                    } else if (response.noti_type === 'SERVICE') {
                        if (response.objId) {
                            response.serviceProviderDetails = await this.getServiceProviderDetails(response);

                        }
                    }

                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        response: response
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


        } else {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "Invalid Data",
                response: []
            });
        }
    },

    /** Get Service Provider Details */
    getServiceProviderDetails: async function (responseData) {
        let service = await ServiceProviderSchema.findOne({ _id: responseData.objId });
        if (service) {
            service = service.toObject();
            let city = await CitySchema.findOne({ _id: service.cityId });

            let serviceProviderCategory = await ServiceProviderCategorySchema.findOne({ _id: service.categoryId });

            service.cityName = city !== null ? city.name : '';

            service.categoryName = serviceProviderCategory !== null ? serviceProviderCategory.name : '';

            service.formatedCreatedAt = moment(service.createdAt).format('LL');
            service.formatedUpdatedAt = moment(service.updatedAt).format('LL');

            return service;

        } else {
            return {};
        }
    },

    /** Get Announcement Details */
    getAnnouncementDetails: async function (responseData) {
        let announcement = await NewsSchema.findOne({ _id: responseData.objId });
        if (announcement) {
            announcement = announcement.toObject();
            let city = await CitySchema.findOne({ _id: announcement.cityId });

            let announcementCategory = await NewsCategorySchema.findOne({ _id: announcement.categoryId })

            announcement.cityName = city !== null ? city.name : '';

            announcement.categoryName = announcementCategory !== null ? announcementCategory.name : '';

            announcement.formatedCreatedAt = moment(announcement.createdAt).format('LL');
            announcement.formatedUpdatedAt = moment(announcement.updatedAt).format('LL');

            return announcement;
        } else {
            return {};
        }
    },


    /** Get Masjid Details */
    getMasjidDetails: async function (responseData) {
        let masjid = await MasjidSchema.findOne({ _id: responseData.objId });
        if (masjid) {
            masjid = masjid.toObject();
            let city = await CitySchema.findOne({ _id: masjid.cityId });
            masjid.cityName = city !== null ? city.name : '';
            masjid.images = masjid.image;
            masjid.image = masjid.image[0];

            masjid.formatedCreatedAt = moment(masjid.createdAt).format('LL');
            masjid.formatedUpdatedAt = moment(masjid.updatedAt).format('LL');

            return masjid;
        } else {
            return {};
        }
    },


    /** Add FAQ Model */
    addFaqModel: function (data, callback) {
        if (data) {
            new FaqSchema(data).save((err, result) => {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Error.",
                        response: err
                    })
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Submitted successfully.",
                        response: result
                    })
                }
            })
        }
    },

    /** Edit FAQ */
    editFaqModel: function (data, callback) {
        if (data) {
            FaqSchema.update(
                { _id: data._id },
                {
                    $set: {
                        question: data.question,
                        answer: data.answer
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

    /** List Faq Model */

    listFaqModel: async function (data, callback) {
        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push({ 'question': new RegExp(data.searchTerm, 'i') });
        }
        // if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
        //     searchArray.push({
        //         'cityId': data.cityId
        //     });
        // }
        if (searchArray.length > 0) {
            qry = { $or: searchArray };
        }
        FaqSchema.countDocuments(qry).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countFaqs = await FaqSchema.countDocuments().exec()
        let searchFilters = {};
        if (data.searchTerm) {
            searchFilters["question"] = { $regex: data.searchTerm, $options: "i" };
        }
        // if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
        //     searchFilters["cityId"] = data.cityId
        // }
        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }
        let faqs = await FaqSchema.find(searchFilters)
            .sort(sortRecord)
            .limit(limitRecord)
            .skip(skipRecord)
            .exec();

        for (let index = 0; index < faqs.length; index++) {
            //const cityId = news[index].cityId;
            const createdAt = faqs[index].createdAt;
            const updatedAt = faqs[index].updatedAt;
            // let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...faqs[index].toObject(),
                    // cityName: city !== null ? city.name : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }
        let faqCountFiltered = await FaqSchema.find(searchFilters)
        if (faqs.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countFaqs,
                filteredData: faqCountFiltered.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }
        //#endregion old data  
    },

    /** Delete Faq */
    deleteFaqModel: async function (data, callback) {
        if (data) {
            FaqSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },

    /** Add New Sub Admin Model */
    addSubAdminModel: async function (data, callback) {
        if (data) {
            /** Check for admin already exists or not */
            AdminSchema.countDocuments({ email: data.email }, function (err, count) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "Error.",
                        response: err
                    })
                } else {
                    if (count) {
                        callback({
                            success: false,
                            STATUSCODE: 2000,
                            message: "Sub admin exists with this email.",
                            response: {}
                        })
                    } else {
                        const password = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$!');
                        data.password = password;
                        new AdminSchema(data).save(function (err, result) {
                            if (err) {
                                callback({
                                    success: false,
                                    STATUSCODE: 4200,
                                    message: "Error.",
                                    response: err
                                })
                            } else {
                                /** Send the password to admin Email */
                                userData = result.toObject();
                                userData.password = password;
                                userData.name = userData.firstName;
                                mailProperty('userMail')(result.email, userData).send();
                                callback({
                                    success: true,
                                    STATUSCODE: 2000,
                                    message: "Sub admin added successfully!",
                                    response: result
                                })
                            }
                        })

                    }
                }
            })
        }
    },

    /** Edit Sub Admin Model */
    editSubAdminModel: function (data, callback) {
        if (data) {
            AdminSchema.updateOne({ _id: data.id },
                {
                    $set: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        city: data.city
                    }
                }, function (err, result) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "something went wrong!",
                            response: err
                        });
                    } else {
                        callback({
                            success: true,
                            STATUSCODE: 2000,
                            message: "Success"
                        });
                    }
                })
        }
    },

    /** List for all subadmins model */
    listSubAdminModel: async function (data, callback) {
        var searchArray = [];
        var qry = {};
        var combineResponse = [];
        if (data.searchTerm) {
            searchArray.push(
                { 'firstName': new RegExp(data.searchTerm, 'i') },
                { 'lastName': new RegExp(data.searchTerm, 'i') },
                { 'email': new RegExp(data.searchTerm, 'i') },
            );
        }
        // if (data.cityId != undefined && data.cityId != null && data.cityId != '') {
        //     searchArray.push({
        //         'cityId': data.cityId
        //     });
        // }
        if (searchArray.length > 0) {
            qry = { $or: searchArray };
        }
        AdminSchema.countDocuments({ $and: [qry, { userType: '2' }] }).exec(function (err, resCount) {
            if (err) {
                callback({
                    success: false,
                    STATUSCODE: 4200,
                    message: "something went wrong!",
                    response: err
                });
            }
        })
        let countSubAdmins = await AdminSchema.countDocuments({ userType: '2' }).exec()
        let searchFilters = { userType: 2 };
        if (data.searchTerm) {
            // searchFilters["firstName"] = { $regex: data.searchTerm, $options: "i" };
            // searchFilters["lastName"] = { $regex: data.searchTerm, $options: "i" };
            // searchFilters["email"] = { $regex: data.searchTerm, $options: "i" };
        }

        //#region Set pagination and sorting
        let sortRecord = { createdAt: 'desc' };
        let checkIsadmin = data.isAdmin !== undefined ? data.isAdmin : false
        let pageIndex = 1;
        let limitRecord = 1;
        let skipRecord = 0;
        if (checkIsadmin == true) {
            limitRecord = data.limit;
            skipRecord = data.offset;
        } else {
            let pageSize = parseInt(config.limit);
            limitRecord = pageSize;
            if (data.pageSize) {
                pageSize = parseInt(data.pageSize);
            }
            if (data.pageIndex) {
                pageIndex = parseInt(data.pageIndex);
            }
            if (pageIndex > 1) {
                skipRecord = parseInt((pageIndex - 1) * pageSize);
            }
            limitRecord = parseInt(pageSize);
        }
        if (data.sortBy && data.sortType) {
            let sortBy = data.sortBy;
            let sortType = "";
            if (data.sortType.toLowerCase() === "desc") {
                sortType = -1;
            }
            sortRecord[sortBy] = sortType;
        }
        let subAdmins = [];
        if (searchArray.length > 0) {
            subAdmins = await AdminSchema.find({ $and: [qry, { userType: '2' }] })
                .sort(sortRecord)
                .limit(limitRecord)
                .skip(skipRecord)
                .exec();
        } else {
            subAdmins = await AdminSchema.find(searchFilters)
                .sort(sortRecord)
                .limit(limitRecord)
                .skip(skipRecord)
                .exec();
        }

        // let subAdmins = await AdminSchema.find(searchFilters)
        //     .sort(sortRecord)
        //     .limit(limitRecord)
        //     .skip(skipRecord)
        //     .exec();


        for (let index = 0; index < subAdmins.length; index++) {
            //const cityId = news[index].cityId;
            const createdAt = subAdmins[index].createdAt;
            const updatedAt = subAdmins[index].updatedAt;
            let cityName = [];
            let cities = subAdmins[index].city;
            if (cities.length) {
                for (let i = 0; i < cities.length; i++) {
                    let city = await CitySchema.findOne({ _id: cities[i] });
                    cityName.push(city.name);
                }
            }
            // let city = await CitySchema.findOne({ _id: cityId })
            combineResponse.push(
                {
                    ...subAdmins[index].toObject(),
                    cityName: cityName.length ? cityName.join() : '',
                    formatedCreatedAt: moment(createdAt).format('LL'),
                    formatedUpdatedAt: moment(updatedAt).format('LL')
                }
            )
        }

        // let SubAdminCountFiltered = await AdminSchema.find(searchFilters)

        if (subAdmins.length > 0) {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: countSubAdmins,
                filteredData: subAdmins.length,
                response: combineResponse
            })
        } else {
            callback({
                success: true,
                STATUSCODE: 2000,
                message: "Success",
                totalData: 0,
                filteredData: 0,
                response: []
            })
        }
    },

    /** Delete Sub Admin Model */
    deleteSubAdminModel: function (data, callback) {
        if (data) {
            AdminSchema.deleteOne({ _id: data._id })
                .then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
        }
    },

    /** Block or Unblock Sub Admin Model */
    blockUnblockSubAdminModel: function (data, callback) {
        if (data) {
            let blockStatus = data.blockStatus;
            if (blockStatus === 'yes') {
                blockStatus = 'no';
            } else {
                blockStatus = 'yes';
            }

            AdminSchema.updateOne({ _id: data._id }, { $set: { blockStatus: blockStatus } }, function (err, res) {
                if (err) {
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "something went wrong!",
                        response: err
                    });
                } else {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                }
            })
        }
    },


    /** Live Broadcasting Model */
    liveBroadcastingModel: function (data, callback) {
        if (data) {
            if (data.startBroadcast) {
                /** update broadcast url to particular city */
                IslamicRadioSchema.updateMany({ $set: { isBroadcastActive: false } }).then(r => {
                    CitySchema.findOne({ _id: data.cityId }, function (err, res) {
                        const cityName = res.name.toLowerCase().replace(/\s/g, '');
                        const rtmpUrl = config.broadcastUrl + cityName;
                        IslamicRadioSchema.updateOne({ cityId: data.cityId },
                            {
                                $set: {
                                    broadcastFilePath: rtmpUrl,
                                    isBroadcastActive: true
                                }
                            }, function (err, res) {
                                if (err) {

                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Broadcast started"
                                    });
                                }
                            })
                    })
                });
            } else {
                /** Update all broadcast to false */
                IslamicRadioSchema.updateMany({ $set: { isBroadcastActive: false } }).then(r => {
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Broadcast stopped"
                    });
                })
            }
        }
    }

}

module.exports = commonModel;