module.exports = function (profile) {
	var profileContainer = {
		"local": {
			APN_CERTI: "/certificate/CIDACDevCertificates.pem",
			APN_KEY: "/certificate/CIDACDevKeyCertificates.pem",
			FCM_SERVER_KEY: 'AAAAH559nVA:APA91bEzOYOGGtuhbKZ7xUPslVF75ruGmDn4uE-B17c1-AIJzVipRRHzQIavqBIBubRProW_1p401qOfqDlQcG0VwRoDVy3gJJppQfKKR5-XgFyKJItUf1vuHFtJsiys52W8vXEOkaJx'

		},
		"production": {
			APN_CERTI: "/certificate/CIDACAdhocCertificates.pem",
			APN_KEY: "/certificate/CIDACAdhocKeyCertificates.pem",
			FCM_SERVER_KEY: 'AAAAH559nVA:APA91bEzOYOGGtuhbKZ7xUPslVF75ruGmDn4uE-B17c1-AIJzVipRRHzQIavqBIBubRProW_1p401qOfqDlQcG0VwRoDVy3gJJppQfKKR5-XgFyKJItUf1vuHFtJsiys52W8vXEOkaJx'

		}

	}
	return profileContainer[profile];
}