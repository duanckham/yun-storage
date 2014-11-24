var path = require('path');
var express = require('express');
var yunOAuth = require('yun-oauth');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var router = require('./lib/router');
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser());
app.use(cookieParser());
app.use(session({secret: '5f1d65f27e370c36dfd845f6dc78b869'}));
app.use(yunOAuth.middleware());
app.use(express.static(__dirname + '/sdk'));
app.use(express.static(__dirname + '/public'));

// CORS
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', req.headers && req.headers.origin ? req.headers.origin : '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);

	if (req.method === 'OPTIONS')
		return res.send(200);

	next();
});

app.use(function(req, res, next) {
	req.user = {openID: 'yun'};
	next();
});

app.use('/', router);
app.listen(process.env.PORT || 10001);

yunOAuth.easyAuth(app, {
	host: CONFIG.DEV_MODE ? '127.0.0.1:10001' : 'storage.yunpro.cn',
	clientID: CONFIG.OAUTH_ID,
	clientSecret: CONFIG.OAUTH_SECRET
});

console.log('* running');