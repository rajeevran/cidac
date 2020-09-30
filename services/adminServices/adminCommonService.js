var config = require('../../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var ObjectID = mongo.ObjectID;
var Admin = require('../../schema/admin/admin');
var fs = require('fs');
var util = require('util');

//======================MONGO MODELS============================
var CommonModel = require('../../models/admin/adminCommonModel');
//======================Module============================
var pushNotification = require('../../modules/pushNotification');
function sendPushNotification(data) {
    CommonModel.getDeviceToken(data, function (res) {
        if (res.STATUSCODE == 2000) {
            async.forEach(res.response, function (item, callBack) {
                var appType = item.appType;
                var deviceToken = item.deviceToken;
                var DeviceData = {
                    deviceId: deviceToken,
                    title: 'CIDAC',
                    noti_type: data.noti_type,
                    "msg": data.msg,
                }
                
                if (deviceToken != undefined && deviceToken != '' && deviceToken != null && data.pushnotify=="true") {
                    var pushData = {
                        deviceToken:deviceToken,
                        cityId:item.cityId,
                        appType:item.appType,
                        msg:data.msg,
                        noti_type:data.noti_type,
                        objId: data.objId ? data.objId : ''
                    };
                    if (appType == "IOS") {
                        // pushNotification.iosPush(DeviceData, function (pushStatus) {
                        //     if (pushStatus.result.sent.length === 1) {
                        //         CommonModel.addNotification(pushData, function (res) { });
                        //     }
                        // });
                        if (DeviceData.noti_type === 'BROADCAST_START' || DeviceData.noti_type === 'BROADCAST_END') {
                            DeviceData.pushId = '';
                            pushNotification.iosPush(DeviceData, function(){});
                        } else {
                            CommonModel.addNotification(pushData, function (res) {
                                if (res.STATUSCODE === 2000) {
                                    DeviceData.pushId = res.response._id;
                                    pushNotification.iosPush(DeviceData, function(){});
                                }
                             });
                        }

                    } else {
                        // pushNotification.androidPush(DeviceData, function (pushStatus) {
                        //     if (pushStatus.success === true) {
                        //         CommonModel.addNotification(pushData, function (res) { });
                        //     }
                        // });

                        if (DeviceData.noti_type === 'BROADCAST_START' || DeviceData.noti_type === 'BROADCAST_END') {
                            DeviceData.pushId = '';
                            pushNotification.androidPush(DeviceData, function(){});
                        } else {
                            CommonModel.addNotification(pushData, function (res) {
                                if (res.STATUSCODE === 2000) {
                                    DeviceData.pushId = res.response._id;
                                    pushNotification.androidPush(DeviceData, function(){});
                                }
                             });
                        }
                    }
                }

                callBack();
            }, function (err, content) {
                return res;
                //callback(res);
            });
        }

    })
}
var common = {
    jwtAuthVerification: (jwtData, callback) => {

        if (jwtData["x-access-token"]) {
            CommonModel.authenticate(jwtData, function (auth) {
                callback(auth);
            })
        } else {
            callback({
                success: false,
                STATUSCODE: 4200,
                message: "token missing",
                response: {}
            })
        }
    },

    updateDeviceToken: function (adminData, callback) {
        CommonModel.updateDeviceToken(adminData, function (res) {
            callback(res);
        })
    },

    adminSignup: function (adminData, callback) {
        if (!adminData.email) {
            callback({
                success: false,
                message: "please enter email"
            });
        }
        if (!adminData.password) {
            callback({
                success: false,
                message: "please enter password"
            });
        }
        if (!adminData.name) {
            callback({
                success: false,
                message: "please enter name"
            });
        }

        async.waterfall([
            function (nextcb) {       //checking email existance
                var cError1 = "";
                Admin.findOne({ email: adminData.email }, function (err, admindet) {
                    if (err)
                        nextcb(err);
                    else {
                        if (admindet) {
                            cError1 = "email already taken";
                        }
                        nextcb(null, cError1);
                    }
                });
            },
            function (cError1, nextcb) {    //updating admin's data
                if (cError1) {
                    nextcb(null, cError1);
                } else {
                    var admin = new Admin(adminData);
                    admin.save(function (err) {
                        if (err) {
                            nextcb(err);
                        } else {
                            nextcb(null, cError1);
                        }
                    });
                }
            }

        ], function (err, cError) {
            if (err) {
                callback({ success: false, message: "some internal error has occurred", err: err });
            } else if (cError != "") {
                callback({ success: false, message: cError });
            } else {
                callback({ success: true, message: "Admin saved successfully" })
            }
        });
    },
    adminLogin: function (adminData, callback) {
        var id = "0";
        if (adminData.email && adminData.password) {

            Admin.findOne({ email: adminData.email })
                .select('password name companyName permission authtoken blockStatus userType city')
                .lean(true)
                .then(function (loginRes) {
                    if (!loginRes) {
                        callback({
                            success: false,
                            STATUSCODE: 4000,
                            message: "User doesn't exist",
                            response: {}
                        });
                    } else {

                        if (loginRes.userType === '2' && loginRes.blockStatus === 'yes') {
                            callback({
                                success: false,
                                STATUSCODE: 4000,
                                message: "Account is blocked. Please contact administrator",
                                response: {}
                            });
                        } else {
                            var c = bcrypt.compareSync(adminData.password, loginRes.password);
                            if (!c) {
                                callback({
                                    success: false,
                                    STATUSCODE: 4000,
                                    message: "User name or password is wrong",
                                    response: {}
                                });
                            } else {
                                var token = jwt.sign({
                                    email: adminData.email,
                                    adminId: loginRes._id,
                                    userType: loginRes.userType,
                                    city: loginRes.city
                                }, config.secretKey, { expiresIn: '12h' });

                                Admin.update({
                                    _id: loginRes._id
                                }, {
                                    $set: {
                                        authtoken: token
                                    }
                                }, function (err, resUpdate) {
                                    if (err) {

                                    } else {
                                        callback({
                                            success: true,
                                            STATUSCODE: 2000,
                                            message: "Login success",
                                            response: {
                                                email: adminData.email,
                                                token: token,
                                                "userType": loginRes.userType,
                                                "permission": loginRes.permission,
                                                "name": loginRes.name,
                                                "companyName": loginRes.companyName,
                                                "profileImage": loginRes.profileImage,
                                                "blockStatus": loginRes.blockStatus,
                                                "city": loginRes.city
                                            }
                                        })
                                    }
                                });

                            }
                        }
                    }

                });
        } else {
            callback({
                success: false,
                STATUSCODE: 5000,
                message: "Insufficient information provided for user login",
                response: {}
            });
        }
    },
    addQuestionService: function (adminData, callback) {
        CommonModel.addQuestionModel(adminData, function (res) {
            callback(res);
        })
    },
    listQuestionService: function (adminData, callback) {
        CommonModel.listQuestionModel(adminData, function (res) {
            callback(res);
        })
    },
    editQuestionService: function (adminData, callback) {
        CommonModel.editQuestionModel(adminData, function (res) {
            callback(res);
        })
    },

    getAllQuestionService: function (adminData, callback) {
        CommonModel.getAllQuestionModel(adminData, function (res) {
            callback(res);
        })
    },

    //#region news
    addNewsService: function (data, fileData, callback) {
        if (fileData === null) {
            data.image = config.newsPath + 'no-img.jpg';
            CommonModel.addNewsModel(data, function (result) {
                if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                    data.noti_type = 'NEWS';
                    if (data.pnText) {
                        data.msg = data.pnText;
                    } else {
                        data.msg = result.response.title + ' announcement has been added in your city.';
                    }
                    data.objId = result.response._id;
                    sendPushNotification(data);
                }
                callback(result)
            });
        } else {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadNewsPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    data.image = config.newsPath + fileName;
                    CommonModel.addNewsModel(data, function (result) {
                        // if (result.STATUSCODE == 2000) {
                        //     data.noti_type = 'NEWS';
                        //     data.msg = result.response.title + ' announcement has been added in your city.';
                        //     data.objId = result.response._id;
                        //     sendPushNotification(data)
                        // }
                        if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                            data.noti_type = 'NEWS';
                            if (data.pnText) {
                                data.msg = data.pnText;
                            } else {
                                data.msg = result.response.title + ' announcement has been added in your city.';
                            }
                            data.objId = result.response._id;
                            sendPushNotification(data);
                        }
                        callback(result)
                    });
                }
            });
        }

    },
    listNewsService: function (adminData, callback) {
        CommonModel.listNewsModel(adminData, function (res) {
            callback(res);
        })
    },
    editNewsService: function (data, fileData, callback) {
        if (fileData === null) {
            console.log('fileData is null-->')
            data.image = data.image[0].replace(/undefined/g, '');
            data.image = data.image.replace(/,/g, '');;
            CommonModel.editNewsModel(data, function (result) {
                callback(result)
            });
        } else {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadNewsPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    if (data.image == (config.newsPath + fileName)) {

                    } else {
                        data.image = config.newsPath + fileName;
                    }
                    CommonModel.editNewsModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        }
    },
    deleteNewsService: function (adminData, callback) {
        CommonModel.deleteNewsModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllNewsService: function (adminData, callback) {
        CommonModel.getAllNewsModel(adminData, function (res) {
            callback(res);
        })
    },
    //#endregion


    //#region newscategory
    addNewsCategoryService: function (adminData, callback) {
        CommonModel.addNewsCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    listNewsCategoryService: function (adminData, callback) {
        CommonModel.listNewsCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    editNewsCategoryService: function (adminData, callback) {
        CommonModel.editNewsCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteNewsCategoryService: function (adminData, callback) {
        CommonModel.deleteNewsCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllNewsCategoryService: function (adminData, callback) {
        CommonModel.getAllNewsCategoryModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion newscategory

    //#region service Provider
    addServiceProviderService: function (data, fileData, callback) {
        if (fileData !== null) {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadServiceProviderPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    data.image = config.serviceproviderPath + fileName;
                    CommonModel.addServiceProviderModel(data, function (result) {
                        if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                            data.noti_type = 'SERVICE';
                            if (data.pnText) {
                                data.msg = data.pnText;
                            } else {
                                data.msg = result.response.name + ' service has been added in your city.';
                            }
                            data.objId = result.response._id;
                            sendPushNotification(data)
                        }
                        callback(result);
                    });
                }
            });
        } else {
            data.image = config.serviceproviderPath + 'no-img.jpg';
            CommonModel.addServiceProviderModel(data, function (result) {
                if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                    data.noti_type = 'SERVICE';
                    if (data.pnText) {
                        data.msg = data.pnText;
                    } else {
                        data.msg = result.response.name + ' service has been added in your city.';
                    }
                    data.objId = result.response._id;
                    sendPushNotification(data);
                }
                callback(result);
            });
        }
    },
    listServiceProviderService: function (adminData, callback) {
        CommonModel.listServiceProviderModel(adminData, function (res) {
            callback(res);
        })
    },
    editServiceProviderService: function (data, fileData, callback) {
        if (fileData !== null) {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadNewsPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    if (data.image != (config.newsPath + fileName)) {
                        data.image = config.newsPath + fileName;
                    }
                    CommonModel.editServiceProviderModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        } else {
            data.image = data.image[0].replace(/undefined/g, '');
            data.image = data.image.replace(/,/g, '');
            CommonModel.editServiceProviderModel(data, function (result) {
                callback(result)
            });
        }

    },
    deleteServiceProviderService: function (adminData, callback) {
        CommonModel.deleteServiceProviderModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllServiceProviderService: function (adminData, callback) {
        CommonModel.getAllServiceProviderModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion


    //#region  service provider category
    addServiceProviderCategoryService: function (adminData, callback) {
        CommonModel.addServiceProviderCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    listServiceProviderCategoryService: function (adminData, callback) {
        CommonModel.listServiceProviderCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    editServiceProviderCategoryService: function (adminData, callback) {
        CommonModel.editServiceProviderCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteServiceProviderCategoryService: function (adminData, callback) {
        CommonModel.deleteServiceProviderCategoryModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllServiceProviderCategoryService: function (adminData, callback) {
        CommonModel.getAllServiceProviderCategoryModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion service provider category

    //#region Masjid Listing
    addMasjidService: function (data, fileData, callback) {
        let uploadedFiles = [];
        let folderPath = config.uploadMasjidPath;
        let count = 0;
        if (fileData) {
            if(fileData.image.length) {
                /** For Multiple images chosen */
            
                // async.times(fileData.image.length, function(n, next) {
                //     let ext = fileData.image[n].name.slice(fileData.image[n].name.lastIndexOf('.'));
                //     let fileName = Date.now() + ext;
                //      fileData.image[n].mv(folderPath + fileName, (err) => {
                //         if (err) {
                //             callback({
                //                 "success": false,
                //                 "STATUSCODE": 5005,
                //                 "message": "INTERNAL DB ERROR",
                //                 "response": err
                //             })
                //         } else {
                //             let pushFile = config.masjidPath + fileName;
                //             uploadedFiles.push(pushFile);
                //             if (n === fileData.image.length -1) {
                //                 data.image = uploadedFiles;
                //                 CommonModel.addMasjidModel(data, function (result) {
                //                     callback(result)
                //                     if (result.STATUSCODE == 2000) {
                //                         data.noti_type = 'MASJID';
                //                         data.msg = data.name + ' masjid has been added in your city.';
                //                         data.objId = result.response._id;
                //                         sendPushNotification(data)
                //                     }
                //                 });
                //             }
                //         }
                //     })
                // })


                for (let img of fileData.image) {
                    let ext = img.name.slice(img.name.lastIndexOf('.'));
                    let fileName = Date.now() + ext;
                    img.mv(folderPath + fileName, (err) => {
                        if (err) {
                            callback({
                                "success": false,
                                "STATUSCODE": 5005,
                                "message": "INTERNAL DB ERROR",
                                "response": err
                            })
                        } else {
                            let pushFile = config.masjidPath + fileName;
                            uploadedFiles.push(pushFile);
                            count++;
                            if (count === fileData.image.length) {
                                data.image = uploadedFiles;
                                CommonModel.addMasjidModel(data, function (result) {
                                    if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                                        data.noti_type = 'MASJID';
                                        if (data.pnText) {
                                            data.msg = data.pnText;
                                        } else {
                                            data.msg = data.name + ' masjid has been added in your city.';
                                        }
                                        data.objId = result.response._id;
                                        sendPushNotification(data);
                                    }
                                    callback(result)
                                });
                            }
                            //count++;
                        }
                    })
                }
            } else {
                /** For single image chosen */
                let pic = fileData.image;
                let ext = pic.name.slice(pic.name.lastIndexOf('.'));
                let fileName = Date.now() + ext;
                pic.mv(folderPath + fileName, (err) => {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response": err
                        })
                    } else {
                        let pushFile = config.masjidPath + fileName;
                        uploadedFiles.push(pushFile);
                        data.image = uploadedFiles;
                        CommonModel.addMasjidModel(data, function (result) {   
                            if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                                data.noti_type = 'MASJID';
                                if (data.pnText) {
                                    data.msg = data.pnText;
                                } else {
                                    data.msg = data.name + ' masjid has been added in your city.';
                                }
                                data.objId = result.response._id;
                                sendPushNotification(data);
                            }
                            callback(result)
                        });
                    }
                })

            }
        } else {
            uploadedFiles[0] = config.masjidPath + 'no-img.jpg';
            data.image = uploadedFiles;
            CommonModel.addMasjidModel(data, function (result) {
                if (result.STATUSCODE == 2000 && data.pushnotify === 'true') {
                    data.noti_type = 'MASJID';
                    if (data.pnText) {
                        data.msg = data.pnText;
                    } else {
                        data.msg = data.name + ' masjid has been added in your city.';
                    }
                    data.objId = result.response._id;
                    sendPushNotification(data);
                }
                callback(result)
            });
        }

    },

    listMasjidService: function (adminData, callback) {
        CommonModel.listMasjidModel(adminData, function (res) {
            callback(res);
        })
    },

    /** Edit Masjid service New */

    editMasjidService: function (data, fileData, callback) {
        let uploadedFiles = [];
        if (fileData !== null) {
            let folderPath = config.uploadMasjidPath;
            let count = 0;
            if(fileData.image.length) { 
                /** Multi Image Upload */
                if (data.images) {
                    uploadedFiles = data.images.split(',');
                }
                for (let img of fileData.image) {
                    let ext = img.name.slice(img.name.lastIndexOf('.'));
                    let fileName = Date.now() + ext;
                    img.mv(folderPath + fileName, (err) => {
                        if (err) {
                            callback({
                                "success": false,
                                "STATUSCODE": 5005,
                                "message": "INTERNAL DB ERROR",
                                "response": err
                            })
                        } else {
                            let pushFile = config.masjidPath + fileName;
                            uploadedFiles.push(pushFile);
                            count++;
                            if (count === fileData.image.length) {
                                data.image = uploadedFiles;
                                CommonModel.editMasjidModel(data, function (result) {
                                    callback(result)
                                });
                            }
                            
                        }
                    });
                }
            } else {
                /** Single Image Upload */
                if (data.images) {
                    uploadedFiles = data.images.split(',');
                }

                let pic = fileData.image;
                let ext = pic.name.slice(pic.name.lastIndexOf('.'));
                let fileName = Date.now() + ext;
                pic.mv(folderPath + fileName, (err) => {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response": err
                        })
                    } else {
                        let pushFile = config.masjidPath + fileName;
                        uploadedFiles.push(pushFile);
                        data.image = uploadedFiles;
                        CommonModel.editMasjidModel(data, function (result) {
                            callback(result)
                        });
                    }
                });

            }

        } else {
            // data.image = data.image[0].replace(/undefined/g, '');
            // data.image = data.image.replace(/,/g, '');

            if (data.images) {
                uploadedFiles = data.images.split(',');
                data.image = uploadedFiles;
            } else {
                uploadedFiles[0] = config.masjidPath + 'no-img.jpg';
                data.image = uploadedFiles;
            }
            
            CommonModel.editMasjidModel(data, function (result) {
                callback(result)
            });
        }

    },

    /** Edit Masjid service old */

    // editMasjidService: function (data, fileData, callback) {
    //     let uploadedFiles = [];
    //     if (fileData !== null) {
    //         let folderPath = config.uploadMasjidPath;
    //         let count = 0;
    //         var pic = fileData.image;
    //         var ext = pic.name.slice(pic.name.lastIndexOf('.'));
    //         var fileName = Date.now() + ext;
    //         var folderpath = config.uploadMasjidPath;
    //         pic.mv(folderpath + fileName, function (err) {
    //             if (err) {
    //                 callback({
    //                     "success": false,
    //                     "STATUSCODE": 5005,
    //                     "message": "INTERNAL DB ERROR",
    //                     "response": err
    //                 })
    //             } else {
    //                 if (data.image == (config.masjidPath + fileName)) {

    //                 } else {
    //                     data.image = config.masjidPath + fileName;
    //                 }
    //                 CommonModel.editMasjidModel(data, function (result) {
    //                     callback(result)
    //                 });
    //             }
    //         });
    //     } else {
    //         // data.image = data.image[0].replace(/undefined/g, '');
    //         // data.image = data.image.replace(/,/g, '');

    //         if (data.images) {
    //             uploadedFiles = data.images.split(',');
    //             data.image = uploadedFiles;
    //         } else {
    //             uploadedFiles[0] = config.masjidPath + 'no-img.jpg';
    //             data.image = uploadedFiles;
    //         }
            
    //         CommonModel.editMasjidModel(data, function (result) {
    //             callback(result)
    //         });
    //     }

    // },
    
    deleteMasjidService: function (adminData, callback) {
        CommonModel.deleteMasjidModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllMasjidService: function (adminData, callback) {
        CommonModel.getAllMasjidModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion

    //#region country state city

    listCountryService: function (adminData, callback) {
        CommonModel.listCountryModel(adminData, function (res) {
            callback(res);
        })
    },

    listStateService: function (adminData, callback) {
        CommonModel.listStateModel(adminData, function (res) {
            callback(res);
        })
    },

    listCityService: function (adminData, callback) {
        CommonModel.listCityModel(adminData, function (res) {
            callback(res);
        })
    },
    //#endregion

    //#region Advertisement
    addAdvertisementService: function (data, fileData, callback) {
        if (fileData !== null) {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadAdvertisementPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    data.image = config.advertisementPath + fileName;
                    CommonModel.addAdvertisementModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        } else {
            callback({
                "success": false,
                "STATUSCODE": 4200,
                "message": "Please upload banner image.",
                "response": {}
            })
        }

    },

    listAdvertisementService: function (adminData, callback) {
        CommonModel.listAdvertisementModel(adminData, function (res) {
            callback(res);
        })
    },

    editAdvertisementService: function (data, fileData, callback) {
        if (fileData !== null) {
            var pic = fileData.image;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadAdvertisementPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    //data._id = new ObjectID;
                    if (data.image == (config.advertisementPath + fileName)) {

                    } else {
                        data.image = config.advertisementPath + fileName;
                    }
                    CommonModel.editAdvertisementModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        } else {
            // data._id = new ObjectID;
            data.image = data.image[0].replace(/undefined/g, '');
            data.image = data.image.replace(/,/g, '');
            CommonModel.editAdvertisementModel(data, function (result) {
                callback(result)
            });
        }

    },

    deleteAdvertisementService: function (adminData, callback) {
        CommonModel.deleteAdvertisementModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllAdvertisementService: function (adminData, callback) {
        CommonModel.getAllAdvertisementModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion Advertisement


    //#region AboutIslam


    addAboutIslamService: function (adminData, callback) {
        CommonModel.addAboutIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    listAboutIslamService: function (adminData, callback) {
        CommonModel.listAboutIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    editAboutIslamService: function (adminData, callback) {
        CommonModel.editAboutIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteAboutIslamService: function (adminData, callback) {
        CommonModel.deleteAboutIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllAboutIslamService: function (adminData, callback) {
        CommonModel.getAllAboutIslamModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion AboutIslam



    //#region AboutUs


    addAboutUsService: function (adminData, callback) {
        CommonModel.addAboutUsModel(adminData, function (res) {
            callback(res);
        })
    },
    listAboutUsService: function (adminData, callback) {
        CommonModel.listAboutUsModel(adminData, function (res) {
            callback(res);
        })
    },
    editAboutUsService: function (adminData, callback) {
        CommonModel.editAboutUsModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteAboutUsService: function (adminData, callback) {
        CommonModel.deleteAboutUsModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllAboutUsService: function (adminData, callback) {
        CommonModel.getAllAboutUsModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion AboutUs





    //#region PillerOfIslam


    addPillerOfIslamService: function (adminData, callback) {
        CommonModel.addPillerOfIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    listPillerOfIslamService: function (adminData, callback) {
        CommonModel.listPillerOfIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    editPillerOfIslamService: function (adminData, callback) {
        CommonModel.editPillerOfIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    deletePillerOfIslamService: function (adminData, callback) {
        CommonModel.deletePillerOfIslamModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllPillerOfIslamService: function (adminData, callback) {
        CommonModel.getAllPillerOfIslamModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion PillerOfIslam




    //#region Prayer
    addPrayerService: function (adminData, callback) {
        CommonModel.addPrayerModel(adminData, function (res) {
            callback(res);
        })
    },
    listPrayerService: function (adminData, callback) {
        CommonModel.listPrayerModel(adminData, function (res) {
            callback(res);
        })
    },
    editPrayerService: function (adminData, callback) {
        CommonModel.editPrayerModel(adminData, function (res) {
            callback(res);
        })
    },
    deletePrayerService: function (adminData, callback) {
        CommonModel.deletePrayerModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllPrayerService: function (adminData, callback) {
        CommonModel.getAllPrayerModel(adminData, function (res) {
            callback(res);
        })
    },
    getPrayerByDateService: function (adminData, callback) {
        CommonModel.getPrayerByDateModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion Prayer


    //#region Announcement
    addAnnouncementService: function (adminData, callback) {
        CommonModel.addAnnouncementModel(adminData, function (res) {
            callback(res);
        })
    },
    listAnnouncementService: function (adminData, callback) {
        CommonModel.listAnnouncementModel(adminData, function (res) {
            callback(res);
        })
    },
    editAnnouncementService: function (adminData, callback) {
        CommonModel.editAnnouncementModel(adminData, function (res) {
            callback(res);
        })
    },
    deleteAnnouncementService: function (adminData, callback) {
        CommonModel.deleteAnnouncementModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllAnnouncementService: function (adminData, callback) {
        CommonModel.getAllAnnouncementModel(adminData, function (res) {
            callback(res);
        })
    },
    editAnnouncementStatusService: function (adminData, callback) {
        CommonModel.editAnnouncementStatusModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion Announcement
    getHomeService: function (adminData, callback) {
        CommonModel.getHomeModel(adminData, function (res) {
            callback(res);
        })
    },

    editBannerStatusService: function (adminData, callback) {
        CommonModel.editBannerStatusModel(adminData, function (res) {
            callback(res);
        })
    },

    //#region IslamicRadio


    addIslamicRadioService: function (data, fileData, callback) {
        if (fileData !== null) {
            var pic = fileData.radioFilePath;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadIslamicRadioPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    data.radioFilePath = config.islamicRadioPath + fileName;
                    CommonModel.addIslamicRadioModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        } else {

            data.radioFilePath = config.islamicRadioPath + 'no-img.jpg';
            CommonModel.addIslamicRadioModel(data, function (result) {
                callback(result)
            });
        }

    },

    listIslamicRadioService: function (adminData, callback) {
        CommonModel.listIslamicRadioModel(adminData, function (res) {
            callback(res);
        })
    },
    editIslamicRadioService: function (data, fileData, callback) {

        if (fileData !== null) {
            var pic = fileData.radioFilePath;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadIslamicRadioPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": err
                    })
                } else {
                    //data._id = new ObjectID;
                    data.radioFilePath = config.islamicRadioPath + fileName;
                    CommonModel.editIslamicRadioModel(data, function (result) {
                        callback(result)
                    });
                }
            });
        } else {
            // data._id = new ObjectID;
            data.radioFilePath = data.radioFilePath[0].replace(/undefined/g, '');
            data.radioFilePath = data.radioFilePath.replace(/,/g, '');

            CommonModel.editIslamicRadioModel(data, function (result) {
                callback(result)
            });
        }

    },
    deleteIslamicRadioService: function (adminData, callback) {
        CommonModel.deleteIslamicRadioModel(adminData, function (res) {
            callback(res);
        })
    },
    getAllIslamicRadioService: function (adminData, callback) {
        CommonModel.getAllIslamicRadioModel(adminData, function (res) {
            callback(res);
        })
    },

    editIslamicRadioStatusService: function (adminData, callback) {
        CommonModel.editIslamicRadioStatusModel(adminData, function (res) {
            callback(res);
        })
    },

    //#endregion IslamicRadio


    getTermsAndConditionsService: function (adminData, callback) {
        CommonModel.getTermsAndConditionsModel(adminData, function (res) {
            callback(res);
        })
    },
    editTermsAndConditionsService: function (adminData, callback) {
        CommonModel.editTermsAndConditionsModel(adminData, function (res) {
            callback(res);
        })
    },

    getPrivacyPolicyService: function (adminData, callback) {
        CommonModel.getPrivacyPolicyModel(adminData, function (res) {
            callback(res);
        })
    },

    sendPushNotification: function (data, callback) {
        sendPushNotification(data)
        callback(data);
    },

    /** List of push notification service */
    listPushotification: function(data, callback) {
        CommonModel.listPushNotificationModel(data, function (res) {
            callback(res);
        })
    },

    /** Details of Push notification Service */
    pushNotificationDetails: function(data, callback) {
        CommonModel.pushNotificationDetailsModel(data, function(res) {
            callback(res);
        })
    },

    /** Add FAQ Service */
    addFaq: function(data, callback) {
        CommonModel.addFaqModel(data, function(res) {
            callback(res);
        })
    },

    /** Edit FAQ */
    editFaq: function(data, callback) {
        CommonModel.editFaqModel(data, function (res) {
            callback(res);
        })
    },

    /** List Faq Service */
    listFaqService: function(data, callback) {
        CommonModel.listFaqModel(data, function (res) {
            callback(res);
        })
    },

    /** Delete Faq Service */
    deleteFaqService: function(data, callback) {
        CommonModel.deleteFaqModel(data, function (res) {
            callback(res);
        })
    },

    /** Add Sub Admin Service */
    addSubAdmin: function(data, callback) {
        CommonModel.addSubAdminModel(data, function(result) {
            callback(result);
        });
    },

    /** Edit Sub Admin Service */
    editSubAdminService: function(data, callback) {
        CommonModel.editSubAdminModel(data, function(result) {
            callback(result);
        });
    },

    /** List Sub admin service */
    listSubAdmins: function(data, callback) {
        CommonModel.listSubAdminModel(data, function (res) {
            callback(res);
        })
    },

    /** Delete Sub Admin Service */
    deleteSubAdminService: function(data, callback) {
        CommonModel.deleteSubAdminModel(data, function (res) {
            callback(res);
        })
    },

    /** Block or Unblock Sub admin Service */
    blockUnblockSubAdminService: function(data,  callback) {
        CommonModel.blockUnblockSubAdminModel(data, function (res) {
            callback(res);
        })
    },

    /** Live Broadcasting Service */
    liveBroadcastingService: function(data, callback) {
        CommonModel.liveBroadcastingModel(data, function (res) {
            if (res.STATUSCODE === 2000) {
                if (data.startBroadcast) {
                    data.noti_type = 'BROADCAST_START';
                } else {
                    data.noti_type = 'BROADCAST_END';
                }
                data.msg = res.message;
                data.pushnotify = 'true'
                sendPushNotification(data);
            }
            callback(res);
        })
    }
}

module.exports = common;