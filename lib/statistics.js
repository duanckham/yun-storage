var DB = require('./db');
var config = require('../config');
var nullcb = function() {};

var Statistics = function(argument) {
	return this.init();
};

Statistics.prototype.init = function() {
	CONFIG.DEV_MODE 
		? this.db = new DB('mongodb://127.0.0.1:27017/yun-storage')
		: this.db = new DB(CONFIG.DB.STORAGE);

	return this;
};

Statistics.prototype.countRead = function(fid) {
	var date = new Date(),
		_y = date.getFullYear() + '',
		_m = date.getMonth() + 1 + '',
		_d = date.getDate() + '',
		_h = date.getHours() + '';

	//
	_m = _m[1] ? _m : '0' + _m;
	_d = _d[1] ? _d : '0' + _d;
	_h = _h[1] ? _h : '0' + _h;

	_month = _y + _m;
	_day = _month + _d;
	_hour = _day + _h;

	this.db.collection('storage-statistics').inc({_id: fid + ':' + _month}, {count: 1}, nullcb);
	this.db.collection('storage-statistics').inc({_id: fid + ':' + _day}, {count: 1}, nullcb);
	this.db.collection('storage-statistics').inc({_id: fid + ':' + _hour}, {count: 1}, nullcb);
	this.db.collection('storage-statistics').inc({_id: fid + ':total'}, {count: 1}, nullcb);

	return this;
};

module.exports = Statistics;