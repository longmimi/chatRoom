$(document).ready(function(e) {
	$(window).keydown(function(e){
		if(e.keyCode == 116)  //f5
		{
			if(!confirm("刷新会将所有数据情况，确定要刷新么？"))
			{
				e.preventDefault();
			}
		}
  });
	var from = $.cookie('user'); //读取保存在cookie中名为的user的值。
	var to = 'all';
	$("#input_content").html("");
	// if (/Firefox\/\s/.test(navigator.userAgent)){
	//     var socket = io.connect({transports:['xhr-polling']}); 
	// } 
	// else if (/MSIE (\d+.\d+);/.test(navigator.userAgent)){
	//     var socket = io.connect({transports:['jsonp-polling']}); 
	// } 
	// else { 
	//     var socket = io.connect(); 
	// }
	var socket = io.connect(); 
	socket.emit('online',JSON.stringify({user:from}));
	socket.on('disconnect',function(){
		var msg = '<div style="color:#f00">SYSTEM:连接服务器失败</div>';
		addMsg(msg);
		$("#list").empty();
	});
	socket.on('reconnect',function(){
		socket.emit('online',JSON.stringify({user:from}));
		var msg = '<div style="color:#f00">SYSTEM:重新连接服务器</div>';
		addMsg(msg);
	});
	socket.on('system',function(data){
		var data = JSON.parse(data);
		var time = getTimeShow(data.time);
		var msg = '';
		if(data.type =='online')
		{
			msg += '用户 ' + data.msg +' 上线了！';
		} else if(data.type =='offline')
		{
			msg += '用户 ' + data.msg +' 下线了！';
		} else if(data.type == 'in')
		{
			msg += '你进入了聊天室！';
		} else
		{
			msg += '未知系统消息！';
		}
		var msg = '<div style="color:#f00">系统消息('+time+'):'+msg+'</div>';
		addMsg(msg);
		// play_ring("/ring/online.wav");
	});
	socket.on('userflush',function(data){
		var data = JSON.parse(data);
		var users = data.users;
		flushUsers(users);
	});
	socket.on('say',function(msgData){
		var time = msgData.time;
		time = getTimeShow(time);
		var data = msgData.data;
		if (data.to=='all') {
			addMsg('<div style="color:black">'+data.from+'('+time+')说：<br/>'+data.msg+'</div>');
			console.log('data.to' + data.to+'data.from'+data.from)
		} else if(data.from == from) {
			console.log('data.to' + data.to + 'data.from' + data.from+ 'from 2	'+from)
			addMsg('<div>我('+time+')对'+data.to+'说：<br/>'+data.msg+'</div>');
		} else if(data.to == from)
		{
			console.log('data.to' + data.to + 'data.from' + data.from + 'from 3	' + from)
			addMsg('<div>'+data.from+'('+time+')对我说：<br/>'+data.msg+'</div>');
			// play_ring("/ring/msg.wav");
		}
	});

	socket.on('iamge', function (mydata) {
		let time = mydata.time
		time = getTimeShow(time)
		var myData = mydata.data
		let ImgDIV = document.createElement('div'); 
		// console.dir(data+'tupain');
		// ImgDIV.innerHTML = `<div style="color:black">${data.from}(${data.time})说<br/>
		// 					<div><img src="${data.img}" />
		// 					</div>`
		// addMsg(ImgDIV);

		if (myData.to == 'all') {
			ImgDIV.innerHTML = `<div style="color:black">${myData.from}(${time})说<br/>
							<div><img src="${myData.img}" />
							</div>`
			addMsg(ImgDIV);
			let Imginput = document.getElementById('tupian');
			Imginput.outerHTML = Imginput.outerHTML;
			
		
		} else if (myData.from == from) {
			ImgDIV.innerHTML = `<div style="color:black">我(${time})对${myData.to}说<br/>
							<div><img src="${myData.img}" />
							</div>`
			addMsg(ImgDIV);
			let Imginput = document.getElementById('tupian');
			Imginput.outerHTML = Imginput.outerHTML;
			// console.log('data.to' + data.to + 'data.from' + data.from + 'from 2	' + from)
			// addMsg('<div>我(' + time + ')对' + data.to + '说：<br/>' + data.msg + '</div>');
		} else if (myData.to == from) {
			ImgDIV.innerHTML = `<div style="color:black">${myData.from}(${time})对我说<br/>
							<div><img src="${myData.img}" />
							</div>`
			addMsg(ImgDIV);
			let Imginput = document.getElementById('tupian');
			Imginput.outerHTML = Imginput.outerHTML;
			// console.log('data.to' + data.to + 'data.from' + data.from + 'from 3	' + from)
			// addMsg('<div>' + data.from + '(' + time + ')对我说：<br/>' + data.msg + '</div>');
			// play_ring("/ring/msg.wav");
		}
	});

	function addMsg(msg){
	  $("#contents").append(msg);
	  $("#contents").append("<br/>");
	  $("#contents").scrollTop($("#contents")[0].scrollHeight);//设置滚动条距离上面的高度
	}
	function flushUsers(users)
	{
		var ulEle = $("#list");
		ulEle.empty();
		ulEle.append('<li title="双击聊天" alt="all" onselectstart="return false">所有人</li>');
		for(var i = 0; i < users.length; i ++)
		{
			ulEle.append('<li alt="'+users[i]+'" title="双击聊天" onselectstart="return false">'+users[i]+'</li>')
		}
			//双击对某人聊天
		$("#list > li").dblclick(function(e){
			if($(this).attr('alt') != from)
			{
				to = $(this).attr('alt');
				show_say_to();
			}
		});
		show_say_to();
	}
	$("#input_content").keydown(function(e) {
	  if(e.shiftKey && e.which==13){
		$("#input_content").append("<br/>");
	  } else if(e.which == 13)
	  {
		e.preventDefault();
			say();
	  }
	});

	$("#say").click(function(e){
		say();
	});
	$("#sendImgBtn").click(function (e) {		
			let Imginput = document.getElementById('tupian');
			let file = Imginput.files[0];       //得到该图片  
			let reader = new FileReader();      //创建一个FileReader对象，进行下一步的操作  
			reader.readAsDataURL(file);              //通过readAsDataURL读取图片  	异步读取文件内容，结果用data:url的字符串形式表示

			reader.onload = function () {            //读取完毕会自动触发，读取结果保存在result中  
				let data = { 
					img: this.result,
					to:to,
					from:from
				};
				console.dir(data.img+'图片刚获取');
				socket.emit('sendImg', data);
			}
		
	});
	
	// function addImg(data){
	// 	let imgDiv=`<img src="data.img">`
	// 	$("#contents").
	// }

	function say()
	{
		if ($("#input_content").html() == "") {
			return;
		}
		socket.emit('say',JSON.stringify({to:to,from:from,msg:$("#input_content").html()}));
	  $("#input_content").html("");
	  $("#input_content").focus();
	}
	//显示正在对谁说话
	function show_say_to()
	{
		$("#from").html(from);
		$("#to").html(to=="all" ? "所有人" : to);
		var users = $("#list > li");
		for(var i = 0; i < users.length; i ++)
		{
			if($(users[i]).attr('alt')==to)
			{
				$(users[i]).addClass('sayingto');
			}
			else
			{
				$(users[i]).removeClass('sayingto');
			}
		}
	}
	// function play_ring(url){
	// 	var embed = '<embed id="ring" src="'+url+'" loop="0" autostart="true" hidden="true" style="height:0px; width:0px;0px;"></embed>';
	// 	$("#ring").html(embed);
	// }
	function getTimeShow(time)
	{
		var dt = new Date(time);
		time = dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate() + ' '+dt.getHours() + ':' + (dt.getMinutes()<10?('0'+ dt.getMinutes()):dt.getMinutes()) + ":" + (dt.getSeconds()<10 ? ('0' + dt.getSeconds()) : dt.getSeconds());
		return time;
	}
	$.cookie('isLogin',true);
});
