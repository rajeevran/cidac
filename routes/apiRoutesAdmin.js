'use strict';
var express = require("express");
var commonService = require('../services/adminServices/adminCommonService');
var questionService = require('../services/adminServices/questionService');
var donationService = require('../services/adminServices/donationService');
var contactService = require('../services/adminServices/contactService');
var cityService = require('../services/adminServices/cityService');
var bodyParser = require('body-parser');
var config = require('../config');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var path = require('path');
var secretKey = config.secretKey;

var api = express.Router();
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({
    extended: false
}));
const fs = require('fs');
const DIR = path.resolve(__dirname.replace('routes', 'public'), 'uploads');

const protestedRoutes = ['/addCity', '/editCity', '/addQa', '/listQa', '/deleteQa', '/editQa', '/addQaCategory','/listQaCategory', '/editQaCategory','/deleteQaCategory', '/addAboutIslam','/listAboutIslam','/editAboutIslam','/deleteAboutIslam','/addAboutUs','/listAboutUs','/editAboutUs','/deleteAboutUs','/addPillerOfIslam','/listPillerOfIslam','/editPillerOfIslam','/deletePillerOfIslam','/addSubAdmin','/blockOrUnblockSubAdmin','/deleteSubAdmin','/listSubAdmins','/editSubAdmin','/deleteFaq','/listFaq','/editFaq','/addFaq','/contactUs','/editContactUs','/deleteDonation','/listDonation','/requestDonation','/deleteDonationCategory','/editDonationCategory','/listDonationCategory','/addDonationCategory','/edit-terms-and-condition','/get-terms-and-condition','/get-privay-policy'];

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
    }
});
let upload = multer({ storage: storage });

/** Create Middleware to verify admin starts */
function verifyAdmin(req, res, next) {
    if (!!req.headers.fromweb) {
        if (!req.headers.authtoken) {
            return res.status(401).send({
                success: false,
                STATUSCODE: 4200,
                message: "Unathourized Request",
                response: {}
            });
        }
        let token = req.headers.authtoken;
        if (token === 'null') {
            return res.status(401).send({
                success: false,
                STATUSCODE: 4200,
                message: "Unathourized Request",
                response: {}
            });
        }
    
        let payload = jwt.verify(token, require('../config').secretKey);
        if (!payload) {
            return res.status(401).send({
                success: false,
                STATUSCODE: 4200,
                message: "Unathourized Request",
                response: {}
            });
        }
        if (payload.userType === '1') {
            next();
        } else {
            if (protestedRoutes.includes(req.url)) {
                return res.status(401).send({
                    success: false,
                    STATUSCODE: 4200,
                    message: "You don't have permission for this",
                    response: {}
                });
            }
            req.adminCity = payload.city;
            next();
        }
    } else {
        next();
    }
}


/** Create Middleware to verify admin ends */
api.post('/testfileupload', function (req, res) {
    var adminData = req.body;
    console.log('req.files----->',req.files)
       res.send(req.files);
    
});

api.post('/upload', upload.single('photo'), function (req, res) {
    if (!req.files) {
        return res.send({
            success: false
        });

    } else {
        return res.send({
            success: true
        })
    }
});

api.post('/updateDeviceToken', function (req, res) {
    var adminData = req.body;
    commonService.updateDeviceToken(adminData, function (response) {
        res.send(response);
    });
});

api.post('/adminSignup', function (req, res) {
    var adminData = req.body;
    commonService.adminSignup(adminData, function (response) {
        res.send(response);
    });
});
api.post('/adminLogin', function (req, res) {
    var adminData = req.body;
    commonService.adminLogin(adminData, function (response) {
        res.send(response);
    });
});
api.post('/addQuestion', function (req, res) {
    var adminData = req.body;
    questionService.addQuestionService(adminData, function (response) {
        res.send(response);
    });
});
//#region for News

/** User Middleware */
api.use(verifyAdmin);


api.post('/addNews', function (req, res) {
    var adminData = req.body;
    commonService.addNewsService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/listNews',function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listNewsService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editNews', function (req, res) {
    var adminData = req.body;
    commonService.editNewsService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/deleteNews', function (req, res) {
    var adminData = req.body;
    commonService.deleteNewsService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-news', function (req, res) {
    var adminData = req.body;
    commonService.getAllNewsService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for NewsCategory
api.post('/addNewsCategory', function (req, res) {
    var adminData = req.body;
    commonService.addNewsCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listNewsCategory', function (req, res) {
    var adminData = req.body;
    commonService.listNewsCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editNewsCategory', function (req, res) {
    var adminData = req.body;
    commonService.editNewsCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteNewsCategory', function (req, res) {
    var adminData = req.body;
    commonService.deleteNewsCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-all-newscategory', function (req, res) {
    var adminData = req.body;
    commonService.getAllNewsCategoryService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for ServiceProvider
api.post('/addServiceProvider', function (req, res) {
    commonService.addServiceProviderService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/listServiceProvider', function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listServiceProviderService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editServiceProvider', function (req, res) {
    var adminData = req.body;
    commonService.editServiceProviderService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/deleteServiceProvider', function (req, res) {
    var adminData = req.body;
    commonService.deleteServiceProviderService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-serviceprovider', function (req, res) {
    var adminData = req.body;
    commonService.getAllServiceProviderService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for ServiceProviderCategory
api.post('/addServiceProviderCategory', function (req, res) {
    var adminData = req.body;
    commonService.addServiceProviderCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listServiceProviderCategory', function (req, res) {
    var adminData = req.body;
    commonService.listServiceProviderCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editServiceProviderCategory', function (req, res) {
    var adminData = req.body;
    commonService.editServiceProviderCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteServiceProviderCategory', function (req, res) {
    var adminData = req.body;
    commonService.deleteServiceProviderCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-news', function (req, res) {
    var adminData = req.body;
    commonService.getAllServiceProviderCategoryService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for Masjid
api.post('/addMasjid', function (req, res) {
    var adminData = req.body;
    commonService.addMasjidService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/listMasjid', function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listMasjidService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editMasjid', function (req, res) {
    var adminData = req.body;
    commonService.editMasjidService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/deleteMasjid', function (req, res) {
    var adminData = req.body;
    commonService.deleteMasjidService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-masjid', function (req, res) {
    var adminData = req.body;
    commonService.getAllMasjidService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region city
api.post('/addCity', function (req, res) {
    var adminData = req.body;
    console.log('adminData',adminData)
    cityService.addCity(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editCity', function (req, res) {
    var adminData = req.body;
    cityService.editCity(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listCityForAdmin', function (req, res) {
    var adminData = req.body;
    cityService.listCityForAdmin(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listCity', function (req, res) {
    cityService.listCity(function (response) {
        res.send(response);
    });
});
//#endregion


//#region for Qa
api.post('/addQa', function (req, res) {
    var adminData = req.body;
    questionService.addQaService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listQa', function (req, res) {
    var adminData = req.body;
    questionService.listQaService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteQa', function (req, res) {
    var adminData = req.body;
    questionService.deleteQaService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editQa', function (req, res) {
    var adminData = req.body;
    questionService.editQaService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/publiclistQa', function (req, res) {
    var adminData = req.body;
    questionService.publiclistQaService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for QaCategory
api.post('/addQaCategory', function (req, res) {
    var adminData = req.body;
    questionService.addQaCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listQaCategory', function (req, res) {
    var adminData = req.body;
    questionService.listQaCategoryService(adminData, function (response) {
        res.send(response);
    });
})
api.post('/editQaCategory', function (req, res) {
    var adminData = req.body;
    questionService.editQaCategoryService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteQaCategory', function (req, res) {
    var adminData = req.body;
    questionService.deleteQaCategoryService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion


//#region for Advertisement
api.post('/addAdvertisement', function (req, res) {
    var adminData = req.body;
    commonService.addAdvertisementService(adminData, req.files, function (response) {
        res.send(response);
    });
});
api.post('/listAdvertisement', function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listAdvertisementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editAdvertisement', function (req, res) {
    var adminData = req.body;
    commonService.editAdvertisementService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/deleteAdvertisement', function (req, res) {
    var adminData = req.body;
    commonService.deleteAdvertisementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-advertisement', function (req, res) {
    var adminData = req.body;
    commonService.getAllAdvertisementService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for AboutIslam
api.post('/addAboutIslam', function (req, res) {
    var adminData = req.body;
    commonService.addAboutIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/listAboutIslam', function (req, res) {
    var adminData = req.query;
    commonService.listAboutIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editAboutIslam', function (req, res) {
    var adminData = req.body;
    commonService.editAboutIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteAboutIslam', function (req, res) {
    var adminData = req.body;
    commonService.deleteAboutIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-all-aboutislam', function (req, res) {
    var adminData = req.body;
    commonService.getAllAboutIslamService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for AboutUs
api.post('/addAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.addAboutUsService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/listAboutUs', function (req, res) {
    var adminData = req.query;
    commonService.listAboutUsService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.editAboutUsService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteAboutUs', function (req, res) {
    var adminData = req.body;
    commonService.deleteAboutUsService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-all-aboutislam', function (req, res) {
    var adminData = req.body;
    commonService.getAllAboutUsService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for PillerOfIslam
api.post('/addPillerOfIslam', function (req, res) {
    var adminData = req.body;
    commonService.addPillerOfIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/listPillerOfIslam', function (req, res) {
    var adminData = req.query;
    commonService.listPillerOfIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editPillerOfIslam', function (req, res) {
    var adminData = req.body;
    commonService.editPillerOfIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deletePillerOfIslam', function (req, res) {
    var adminData = req.body;
    commonService.deletePillerOfIslamService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-all-aboutislam', function (req, res) {
    var adminData = req.body;
    commonService.getAllPillerOfIslamService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

//#region for Prayer
api.post('/addPrayer', function (req, res) {
    var adminData = req.body;
    commonService.addPrayerService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listPrayer', function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listPrayerService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editPrayer', function (req, res) {
    var adminData = req.body;
    commonService.editPrayerService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deletePrayer', function (req, res) {
    var adminData = req.body;
    commonService.deletePrayerService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-prayer', function (req, res) {
    var adminData = req.body;
    commonService.getAllPrayerService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/getPrayerByDate', function (req, res) {
    var adminData = req.body;
    commonService.getPrayerByDateService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/home', function (req, res) {
    var adminData = req.body;
    commonService.getHomeService(adminData, function (response) {
        res.send(response);
    });
});
//#endregion

api.post('/editBannerStatus', function (req, res) {
    var adminData = req.body;
    commonService.editBannerStatusService(adminData, function (response) {
        res.send(response);
    });
});

//#region for Announcement
api.post('/addAnnouncement', function (req, res) {
    var adminData = req.body;
    commonService.addAnnouncementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listAnnouncement', function (req, res) {
    var adminData = req.body;
    commonService.listAnnouncementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editAnnouncement', function (req, res) {
    var adminData = req.body;
    commonService.editAnnouncementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteAnnouncement', function (req, res) {
    var adminData = req.body;
    commonService.deleteAnnouncementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-announcement', function (req, res) {
    var adminData = req.body;
    commonService.getAllAnnouncementService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editAnnouncementStatus', function (req, res) {
    var adminData = req.body;
    commonService.editAnnouncementStatusService(adminData, function (response) {
        res.send(response);
    });
})
//#endregion

//#region for IslamicRadio
api.post('/addIslamicRadio', function (req, res) {
    var adminData = req.body;
    commonService.addIslamicRadioService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/listIslamicRadio', function (req, res) {
    var adminData = req.body;
    if (req.adminCity) {
        adminData.adminCity = req.adminCity;
    }
    commonService.listIslamicRadioService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editIslamicRadio', function (req, res) {
    var adminData = req.body;
    commonService.editIslamicRadioService(req.body, req.files, function (response) {
        res.send(response);
    });
});
api.post('/deleteIslamicRadio', function (req, res) {
    var adminData = req.body;
    commonService.deleteIslamicRadioService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/get-all-islamicradio', function (req, res) {
    var adminData = req.body;
    commonService.getAllIslamicRadioService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-terms-and-condition', function (req, res) {
    var adminData = req.body;
    commonService.getTermsAndConditionsService(adminData, function (response) {
        res.send(response);
    });
});
api.post('/edit-terms-and-condition', function (req, res) {
    var adminData = req.body;
    commonService.editTermsAndConditionsService(adminData, function (response) {
        res.send(response);
    });
});
api.get('/get-privay-policy', function (req, res) {
    var adminData = req.body;
    commonService.getPrivacyPolicyService(adminData, function (response) {
        res.send(response);
    });
});
//#Regoin Donation
api.post('/addDonationCategory', function (req, res) {
    var adminData = req.body;
    donationService.addDonationCategory(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listDonationCategory', function (req, res) {
    var adminData = req.body;
    donationService.listDonationCategory(adminData, function (response) {
        res.send(response);
    });
});
api.post('/editDonationCategory', function (req, res) {
    var adminData = req.body;
    donationService.editDonationCategory(adminData, function (response) {
        res.send(response);
    });
});
api.post('/deleteDonationCategory', function (req, res) {
    var adminData = req.body;
    donationService.deleteDonationCategory(adminData, function (response) {
        res.send(response);
    });
});
api.post('/requestDonation', function (req, res) {
    var adminData = req.body;
    donationService.requestDonation(adminData, function (response) {
        res.send(response);
    });
});
api.post('/listDonation', function (req, res) {
    var adminData = req.body;
    donationService.listDonation(adminData, function (response) {
        res.send(response);
    });
})
api.post('/deleteDonation', function (req, res) {
    var adminData = req.body;
    donationService.deleteDonation(adminData, function (response) {
        res.send(response);
    });
})
api.post('/paymentDonation', function (req, res) {
    var adminData = req.body;
    console.log('adminData',adminData)
    donationService.paymentDonation(adminData, function (response) {
        res.send(response);
    });
});
//#Regoin Contact us
api.post('/contactUs', function (req, res) {
    contactService.contactUs(function (response) {
        res.send(response);
    });
})
api.post('/editContactUs', function (req, res) {
    var adminData = req.body;
    contactService.editContactUs(adminData,function (response) {
        res.send(response);
    });
})
api.post('/sendPush', function (req, res) {
    var adminData = req.body;
    commonService.sendPushNotification(adminData,function (response) {
        res.send(response);
    });
})

/** List of Push Notification */
api.post('/listPush', function (req, res) {
    var adminData = req.body;
    commonService.listPushotification(adminData,function (response) {
        res.send(response);
    });
})

/** Details of Push Notification */
api.post('/pushDetails', function(req, res) {
    var data = req.body;
    commonService.pushNotificationDetails(data,function (response) {
        res.send(response);
    });
});

/** Add Faq */
api.post('/addFaq', function (req, res) {
    var adminData = req.body;
    commonService.addFaq(adminData,function (response) {
        res.send(response);
    });
});

/** Edit Faq */
api.post('/editFaq', function (req, res) {
    var adminData = req.body;
    commonService.editFaq(adminData, function (response) {
        res.send(response);
    });
});


/** List Faq */
api.post('/listFaq', function (req, res) {
    var adminData = req.body;
    commonService.listFaqService(adminData, function (response) {
        res.send(response);
    });
});

/** Delete Faq */
api.post('/deleteFaq', function (req, res) {
    var adminData = req.body;
    commonService.deleteFaqService(adminData, function (response) {
        res.send(response);
    });
});

/** Add Sub Admin */
api.post('/addSubAdmin', function(req, res) {
    commonService.addSubAdmin(req.body, function(response) {
        res.send(response);
    });
});

/** Edit Sub amdin */
api.post('/editSubAdmin', function(req, res) {
    commonService.editSubAdminService(req.body, function (response) {
        res.send(response);
    });
})

/** List Sub Admin */
api.post('/listSubAdmins', function(req, res) {
    commonService.listSubAdmins(req.body, function (response) {
        res.send(response);
    });
});

/** Delete Sub Amdin */
api.post('/deleteSubAdmin', function(req, res) {
    commonService.deleteSubAdminService(req.body, function (response) {
        res.send(response);
    });
});

/** Block or unblock sub admin */
api.post('/blockOrUnblockSubAdmin', function(req, res) {
    commonService.blockUnblockSubAdminService(req.body, function (response) {
        res.send(response);
    });
});

/** Live Broadcasting */
api.post('/liveBroadcast', function(req, res) {
    commonService.liveBroadcastingService(req.body, function (response) {
        res.send(response);
    });
})


module.exports = api;