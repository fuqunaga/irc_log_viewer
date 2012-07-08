var config = require('./config.json');
var fs = require('fs');
var path = require('path');

function get_dir(channel)
{
	var data = config.channels[channel] || config.hide_channels[channel];
	return path.join(config.filepath, data.dir);
}
function get_dates(channel)
{
	var dir_path = get_dir(channel);

	var dates = [];
	if ( path.existsSync(dir_path) )
	{
		file_names = fs.readdirSync(dir_path);
		for(var i=0; i<file_names.length; i++)
		{
			// ファイル名から日付パース
			// 120101.log みたいなファイル名を想定
			dates.push(file_names[i].split('.')[0]);
		}
	}
	dates.sort();
	return dates;
}
exports.get_latest_date = function(channel)
{
	var dates = get_dates(channel);
	return dates[dates.length-1];
}
exports.get_channel = function(channel, date)
{
	var dates = get_dates(channel);
	var msgs = [];
	{
		// date がなかったら最新
		var idx = dates.indexOf(date);
		idx = (idx>=0) ? idx : dates.length-1;
		
		var msgs_utf = fs.readFileSync(path.join(get_dir(channel), dates[idx]+".log"), 'utf8').split('\n');

		// メッセージ的なやつだけ抽出
		// ng: 22:59:00 +kuna
		// ok: 22:59:00 <kuna> PRIVMSGメッセージ
		// ok: 22:59:00 {kuna} NOTICEメッセージ
		// time,name,msg にパース
		var regs = {
			"PRIVMSG": /^(\d+:\d+:\d+)\s+<(.+?)>\s(.*)/,
			"NOTICE": /^(\d+:\d+:\d+)\s+{(.+?)}\s(.*)/
		};
		for(var i=0; i<msgs_utf.length; i++)
		{
			var msg_line = msgs_utf[i];
			for(type in regs)
			{
				if ( regs[type].test(msg_line) )
				{
					msgs.push({
						"type":type,
						"time":RegExp.$1,
						"name":RegExp.$2,
						"msg":RegExp.$3
					});
					break;
				}
			}
		}
	}

	return {dates:dates, msgs:msgs};
}

