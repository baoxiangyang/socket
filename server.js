var http = require("http"),
fs = require('fs'),
path = require('path'),
mime = require('mime');
var chatServer = require('./lib/chat_server');
var cache = {};
var server = http.createServer(function(req,res){
	var filePath = false;
	if(req.url == "/"){
		filePath = "public/index.html";
	}else{
		filePath = 'public'+req.url;
	}
	var absPath = './'+filePath;
	serverStatic(res,cache,absPath);
});
server.listen(3000,function(){
	console.log('Server listening on port 3000');
})
chatServer.listen(server);
function send404(res){
	res.writeHead(404,{"Content-Type":"text/plain"});
	res.write("Error 404: resource not found");
	res.end();
};
function sendFile(res,filePath,fileContens){
	res.writeHead(200,{
		'Conetent-Type':mime.lookup(path.basename(filePath))
	});
	res.end(fileContens)
};
function serverStatic(res,cache,absPath){
	console.log(absPath)
	if(cache.absPath){
		sendFile(res,absPath,cache[absPath])
	}else{
		fs.exists(absPath,function(exists){
			if(exists){
				fs.readFile(absPath,function(err,data){
					if(err){
						send404(res)
					}else{
						cache[absPath] = data;
						sendFile(res,absPath,data)
					}
				})
			}else{
				send404(res)
			}
		})
	}
}
 function isNullObj(obj){ //判断是否为空对接.为空返回false
    for(var i in obj){
        if(obj.hasOwnProperty(i)){
            return true;
        }
    }
    return false;
}
