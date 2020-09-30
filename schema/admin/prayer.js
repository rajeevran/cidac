var mongoose = require("mongoose");
var PrayerSchema = new mongoose.Schema({
    date: { type: Date },
    hijriDate: {type: String, default: ''},
    sunrise: { type: Date },
    sunset: { type: Date },
    cityId: { type: mongoose.Schema.Types.ObjectId },
    fajrOpen:{ type: String},
    fajrIqamah:{ type: String},
    zuhrOpen:{ type: String},
    zuhrIqamah:{ type: String},
    dhuhrOpen:{ type: String},
    dhuhrIqamah:{ type: String},
    maghribOpen:{ type: String},
    maghribIqamah:{ type: String},
    ishaOpen:{ type: String},
    ishaIqamah:{ type: String},
    prayers:{ type: Object},
    prayersSunrise:{ type: String},
    prayersSunset:{ type: String}
},{
    timestamps: true
});

// Export your module
module.exports = mongoose.model("Prayer", PrayerSchema);
