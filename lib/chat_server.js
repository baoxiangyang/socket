var socketio = require('socket.io'),
guestNumber = 1,
nickNames = {},
namesUsed = [];
currentRoom = {};
var io;
exports.listen = function(server){
	 io = socketio.listen(server);
	 io.set('log level',1);
	 io.sockets.on("connection",function(socket){
	 	guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
	 	joinRoom(socket,'Lobby');
	 	handleMessageBoroadcasting(socket,nickNames);
	 	handleNameChangeAttempts(socket,nickNames,namesUsed);
	 	handleRoomJoining(socket,currentRoom);
	 	socket.on('rooms',function(){
	 		socket.emit('rooms', io.sockets.adapter.rooms);
	 	});
	 	handleClientDisconnection(socket)
	 });
}
function assignGuestName(socket,guestNumber,nickNames,namesUsed){ //进入用户保存一个临时名字
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult',{
		success:true,
		name:name
	});
	namesUsed.push(name);
	return  guestNumber + 1;
}
function joinRoom(socket,room){  //进入房间，提示谁进的房间。给进入者提示房间中有那些人
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult',{room:room});
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.id] + ' has joined ' + room +'  .'
	})
	var usersInRoom = io.sockets.adapter.rooms[room]
	var usersInRoomSummary = 'Users currently in ' 
	for(var room in usersInRoom){
		if(room != socket.id){
		 usersInRoomSummary  +=  nickNames[room] + '、' ;
		}
	}
	usersInRoomSummary += " .";
	socket.emit('message',{text:usersInRoomSummary})
}
function handleNameChangeAttempts(socket,nickNames,namesUsed){ //更改名字
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest') == 0){
			socket.emit('nameResult',{
				success:false,
				message:'Name cannot begin with Guest'
			})
		}else{
			if(namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName +' is now Known as' + name +' .' 
				});
			}else{
				socket.emit('nameResult',{
					success:false,
					text:"That name is Already in use"
				})
			}
		}
	})
}
function handleMessageBoroadcasting(socket,nickNames){ //用户发送消息
	socket.on('message', function(message){
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id] +': '+message.text
		})
	})
}
function handleRoomJoining(socket,currentRoom){ //更换房间
	socket.on('join' ,function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom)
	})
}
function handleClientDisconnection(socket){ //用户断开链接
	socket.on('disconnect' ,function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id])
		delete namesUsed[nameIndex];
		delete nickNames[socket.id]
	})
}