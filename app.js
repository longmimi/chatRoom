var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');//用于处理文件路径

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server,{log:false});  //socketIO服务器依赖于http服务器，使用listen得方法为http
                                                            //服务器附加一个socketio服务器
var clients = []; //所有客户端
var users = [];  //存储在线用户列表的对象
var oldSocket = "";
var getDiffTime = function()
{
  if(disconnect)
  {
    return connect - disconnect;
  }
  return false;
}
io.sockets.on('connection', function (socket) { //建立连接  服务器监听所有客户端并返回该新连接对象socket
  console.log(socket+'fffffffffffffffffffffffffffffffff')
  socket.on('online',function(data){   
    var data = JSON.parse(data);
   // console.log(clients[data.user]);
    //检查是否是已经登录绑定
    if(!clients[data.user])
    {
      //新上线用户，需要发送用户上线提醒,需要向客户端发送新的用户列表
      users.unshift(data.user);  //数组开头添加并返回开头元素的值
      for(var index in clients)
      {
        clients[index].emit('system',JSON.stringify({type:'online',msg:data.user,time:(new Date()).getTime()}));
        clients[index].emit('userflush',JSON.stringify({users:users}));
      }
      // io.sockets.emit('system', JSON.stringify({ type: 'online', msg: data.user, time: (new Date()).getTime() }));
      // io.sockets.emit('userflush', JSON.stringify({ users: users }));
      socket.emit('system',JSON.stringify({type:'in',msg:'',time:(new Date()).getTime()}));
      socket.emit('userflush',JSON.stringify({users:users}));
    }
      clients[data.user] = socket;
      socket.emit('userflush',JSON.stringify({users:users}));
  });
  socket.on('say',function(data){
    //dataformat:{to:'all',from:'Nick',msg:'msg'}
    data = JSON.parse(data);
    var msgData = {
      time : (new Date()).getTime(),
      data : data
    }
    if(data.to == "all")
    {
      //对所有人说
      for(var index in clients)
      {
        clients[index].emit('say',msgData);
      }
    }
    else
    {
      //对某人说
      clients[data.to].emit('say',msgData);
      clients[data.from].emit('say',msgData);
    }
  });

  /*
  接收图片
  */
  socket.on('sendImg', function (Imgdata) {
    var imgData = {
      time: (new Date()).getTime(),
      data: Imgdata
    }
    if (Imgdata.to == "all") {
      //对所有人说
      for (var index in clients) {
        clients[index].emit('iamge', imgData);
      }
    }
    else {
      //对某人说
      clients[Imgdata.to].emit('iamge', imgData);
      clients[Imgdata.from].emit('iamge', imgData);
    }
    // io.sockets.emit('iamge', Imgdata);
  });



  socket.on('offline', function (user) {  //匿名函数的第一个参数为接收的数据，若有第二个参数，则为要返回的函数
    socket.disconnect();
  });
  socket.on('disconnect',function(){
    //有人下线
    setTimeout(userOffline,100);
    function userOffline()
    {
      for(var index in clients)
      {
        if(clients[index] == socket)
        {
          users.splice(users.indexOf(index),1);
          delete clients[index];
          for(var index_inline in clients)
          {
            clients[index_inline].emit('system',JSON.stringify({type:'offline',msg:index,time:(new Date()).getTime()}));
            clients[index_inline].emit('userflush',JSON.stringify({users:users}));
          }
          break;
        }
      }
    }
  });
});

app.configure(function(){
  app.set('port', process.env.PORT || 3006);
  app.set('views', __dirname + '/views');  //设置 views 文件夹为视图文件的目录，存放模板文件，__dirname 为全局变量，存储着当前正在执行脚本所在的目录名。
  app.set('view engine', 'jade'); //设置视图模版引擎为 ejs
  app.use(express.favicon());  //用来设置网站的图标，参数为图标的路径。如果不指明，则用默认的express图标。
  app.use(express.logger('dev')); //connect 内建的中间件，在开发环境下使用，在终端显示简单的不同颜色的日志
  app.use(express.bodyParser()); //connect 内建的中间件，用来解析请求体，支持 application/json， application/x-www-form-urlencoded, 和 multipart/form-data。
  app.use(express.cookieParser());  //为了支持session，在这样的设置中，session会被加密保存在客户端的cookie，但这样程序重启后session就不起作用了，不过express.session支持session的持久化保存，因为express用的最多的数据库就是mongo，所以下面给出用mongo保存session的配置。首先要在package.json里加上依赖项connect-mongo：
  app.use(express.methodOverride()); //connect 内建的中间件，可以协助处理 POST 请求，伪装 PUT、DELETE 和其他 HTTP 方法。
  app.use(app.router);  //设置应用的路由
  app.use(express.static(path.join(__dirname, 'public'))); //connect 内建的中间件，设置根目录下的 public 文件夹为静态文件服务器，存放 image、css、js 文件于此。
});

app.configure('development', function () { //开发环境下的错误处理，输出错误信息。
  app.use(express.errorHandler());
});

app.get('/', function (req, res, next) {
  if(!req.headers.cookie)
  {
    res.redirect('/signin');
    return;
  }
  var cookies = req.headers.cookie.split("; ");
  var isSign = false;
  for(var i = 0 ; i < cookies.length; i ++)
  {
    cookie = cookies[i].split("=");
    if(cookie[0]=="user" && cookie[1] != "")
    {
      isSign = true;
      break;
    }
  }
  if(!isSign)
  {
    res.redirect('/signin');
    return;
  }
  res.sendfile('views/index.html');
});
app.get('/signin',function(req,res,next){
  res.sendfile('views/signin.html');
});
// app.get('/signup',function(req,res,next){
//   res.sendfile('views/signup.html');
// });
app.post('/signin',function(req,res,next){   //用户登录
  res.cookie("user",req.body.username[0]);
  console.log(req.body.username[0]+'dddddddddddd');
  // console.dir(req.body+ 'dddddddddddd');
  res.redirect('/');
});
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
