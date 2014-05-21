var express = require('express');
var yunOAuth = require('yun-oauth');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var router = require('./lib/router');
var app = express();

app.use(bodyParser());
app.use(cookieParser());
app.use(session({secret: '5f1d65f27e370c36dfd845f6dc78b869'}));
app.use(yunOAuth.middleware());
app.use(express.static(__dirname + '/sdk'));

// CORS
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header('Access-Control-Allow-Credentials', true);

	next();
});

app.use(function(req, res, next) {
	// res.redirect('/yunoauth2');
	req.uesr = {openID: 'yun'};
	next();
});

app.use('/', router);
app.listen(process.env.PORT || 10005);

yunOAuth.easyAuth(app, {
	host: CONFIG.DEV_MODE ? '127.0.0.1:10005' : 'storage.yunpro.cn',
	clientID: CONFIG.OAUTH_ID,
	clientSecret: CONFIG.OAUTH_SECRET
});

console.log('* running');