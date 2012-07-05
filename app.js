/**
 * Module dependencies.
 */
var express = require('express')
	, log = require('./log');

var app = module.exports = express.createServer();
var config = require('./config.json');


// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Routes
function render_log(res, channel, date)
{
	var data = log.get_channel(channel, date);
	if ( data.dates.length ){
		bar_channels = [];
		for(var name in config.channels) bar_channels.push(name);
		
		var dates = {}
		var raws = data.dates;
		for(var i=0; i<raws.length; ++i){
			var raw = raws[i];
			// hashのキーに数字はまずいので一文字加えとく
			// もっとマシな方法はないものか・・
			var year = "_" + raw.substr(0,2);
			var month = "_" + raw.substr(2,2);
			var day = "_" + raw.substr(4,2);
			if ( null == dates[year] ) dates[year] = {};
			if ( null == dates[year][month] ) dates[year][month] = [];
			dates[year][month].push(day);
		}

		res.render('index', { 
			bar_channels: bar_channels,
			channel: channel,
			dates: dates,
			current_date: date,
			msgs: data.msgs
		});
	}
}
app.get('/', function(req,res){
	res.redirect('/view');
});
app.get('/view', function(req,res){
	res.redirect('/view/'+ Object.keys(config.channels)[0]);
});
app.get('/view/:channel', function(req,res){
	res.redirect('/view/'+req.params.channel+'/latest');
});
app.get('/view/:channel/latest', function(req,res){
	render_log(res, req.params.channel, log.get_latest_date(req.params.channel));
});
app.get('/view/:channel/:date', function(req,res){
	render_log(res, req.params.channel, req.params.date);
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
