xMan
============

## xMan中文文档
*一个通用的跨域解决方案*

`xMan`是一个高效的,轻量,易用(整个类库加上扩展方法一共只有10个API),兼容性很强的的跨域帮助库.支持ie6+以上以及所有主流的高级浏览器,提供get和post方法两种跨域方式.<br>
使用`xMan`可以让你的代码实现无缝跨域逻辑的实现.`xMan`竭尽所能的提供各种方法并尽力精简了以下的跨域方法,以便可以让开发者更好的进行跨域操作.

你可以在遵守 MIT Licence 的前提下随意使用并分发它。`xMan` 代码完全开源并托管在 Github 上。

### xMan的引入
```html

  <script type="text/javascript" src="./XMan.js"></script>
    
```
### xMan如何向外暴露(兼容AMD和CMD)

xMan在生成是先行检测并依附于全局环境中的`exports`和`module`,如果没有的该属性则再次检索依附于`define`和`define.amd`,如果上述两种情况都不存在便依附于`window`.依顺序逐个依附.

```js

// 以下为判断逻辑。需要更改的话，请下载之后在此处修改依附逻辑。
  if ("object" == typeof exports && "undefined" != typeof module) {
      module.exports = entrance();
  } else if ("function" == typeof define && define.amd) {
      define([], entrance());
  } else {
      var platform;
      if ("undefined" != typeof window) {
          platform = window
      } else {
           "undefined" != typeof global ? platform = global : "undefined" != typeof self && (platform = self)
      }
       platform.x = entrance()
  }

```

### xMan如何使用

##### 须知:本实例的静态资源统一通过http://localhost:63342访问.跨域接口统一通过http://cross.domain.com:3000访问

*为了模拟跨域场景,需提前配置host.这里暂时将本机的host配置为`cross.domain.com`*

该类库提供的方法皆为异步方法.使用时可直接用x.方法名(parma[...]).使用该方法.如下:

```js

  // 本事例仅做演示.
  // 以下实例均可在index.html中找到
    
  x.jsonp('http://cross.domain.com:3000/jsonp', {type: 'jsonp'}, 'cb', function (data) {
      console.log('[LOG] type:jsonp,data: ' + JSON.stringify(data));
  });

  x.crossDomain('post', 'http://cross.domain.com:3000/cors', {type: 'cors'}, function (data) {
      console.log('[LOG] type:cors,data: ' + JSON.stringify(data));
  });

  x.formRequest('post', 'http://cross.domain.com:3000/form', {type: 'form'}, function (data) {
      console.log('[LOG] type:form,data: ' + JSON.stringify(data));
  });

  var outer = x.frame(window.frames[0]);
    
  outer.on('triggerOuter', function (data) {
      console.log('[LOG triggerOuter] type:frames,data: ' + JSON.stringify(data))
  });
    
  outer.on('Message', function (data) {
      console.log('[LOG Message Outer] type:frames,data: ' + JSON.stringify(data))
  });
    
  outer.emit('triggerInner', {from: 'outer'});
    
  outer.send('this msg from outer');
    
```

### xMan都有哪些方法
*xMan提供4种请求类型的方法，其中包括`jsonp`、`corssDoamin`、`formrequest`以及`frame`。其中前三种是用于前端与后端进行跨域交互时使用。最后一种frame则是在不同域名的frame窗口之间交互时使用，与服务器不做任何交互，仅仅只是前端不同域名的iframe之间使用。*

#### 1) jsonp(url, data, jsonpName, callback);
此方法提供是jsonp功能.

`参数列表:`
>+ @param url         {string} 请求路径
>+ @param data        {string | object} 发送数据
>+ @param jsonpName   {string} 回调函数名称
>+ @param callback    {function} 回调函数
  
`示例用法:`

```js

 x.jsonp('http://cross.domain.com:3000/jsonp', {type: 'jsonp'}, 'cb', function (data) {
     console.log('[LOG] type:jsonp,data: ' + JSON.stringify(data));
 });
    
```

`注意:`<br/>
1: 此方法只能为`GET`方法.<br/>
2: 此方法请求数据有大小限制.(chrome为8k,firefox为7k,ie为2k),所以传输的数据量过大可能造成数据不完整.<br/>
3: 此方法的兼容性为IE6+以及所有主流浏览器.<br/>

#### 2) crossDomain(type, url, data, callback, settings);
此方法提供的是跨域资源共享功能(切记:此方法需要server端紧密配合).

`参数列表:`
>+ @param type         {string} 跨域方法,可以使用两种(GET | POST)
>+ @param url        {string} 请求路径
>+ @param data      {string | string} 发送数据
>+ @param callback    {function} 回调函数
>+ @param settings    {object | undefined} 配置参数列表

*`settings`是配置参数列表,此列表提供了两个参数[withCredentials]和[headers].其中[withCredentials]为boolean类型,true为携带用户cookie,false(默认)为不携带用户cookie.[headers]为object类型,
主要用于用户自定义头信息.这两个参数都必须服务器允许才可使用,否则会触发`安全错误`.*

`示例用法:`

```js

 // 前端代码
 // 服务器制定头信息为 myself:byMyself
 x.crossDomain('post', 'http://cross.domain.com:3000/cors', {type: 'cors'}, function (data) {
      console.log('[LOG] type:cors,data: ' + JSON.stringify(data));
 },{withCredentials:true,headers{'myself':'byMyself'}});
 
 // server代码(仅以nodejs为例)
 // 设置允许传输cookie和允许前端自定义指定头信息
  response.writeHead(200, {'Access-Control-Allow-Origin': 'http://localhost:63342',// 
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'myself'
  :});
 
    
```

`注意:`<br/>
1: 此方法可使用`GET`或`POST`方法.<br/>
2: 此方法跨域携带cookie和使用自定义头信息必须服务器端配置响应的响应头信息.详情请见:http://www.w3.org/TR/cors<br/>
3: 此方法的兼容性为IE8+以及所有主流浏览器.<br/>

#### 3) formRequest(type, url, data, callback, enctype);
此方法提供的是基本跨域传输功能(切记:此方法需要server端紧密配合).

`参数列表:`
>+ @param type         {string} 跨域方法,可以使用两种(GET | POST)
>+ @param url        {string} 请求路径
>+ @param data      {string | string} 发送数据
>+ @param callback    {function} 回调函数
>+ @param enctype    {string} 编码格式

*`enctype`提供3种选择:<br/>
 1:  [application/x-www-form-urlencoded] 在发送前编码所有字符（默认）;<br/>
 2:  [multipart/form-data] 不对字符编码; <br/>
 3:  [text/plain] 空格转换为 "+" 加号，但不对特殊字符编码;*

`示例用法:`

```js

 // 前端代码
  x.formRequest('post', 'http://cross.domain.com:3000/form', {type: 'form'}, function (data) {
       console.log('[LOG] type:form,data: ' + JSON.stringify(data));
  },'application/x-www-form-urlencoded');
 
 // server代码(仅以nodejs为例)
  var content = 'server数据' 
  var header = {
       // 这里一定要设置content-type为text/html否则获取返回数据有可能失效
       'content-type': 'text/html; chatset=utf-8',
       'set-cookie': cookie
  };
  response.writeHead(200, header);
  response.end('<html><head><script>window.name=' 
  + JSON.stringify(content) 
  + ';location.href="about:blank";</script></head><body></body></html>');
 
```

`注意:`<br/>
1: 此方法可使用`GET`或`POST`方法.<br/>
2: 此方法可以默认为携带cookie<br/>
3: 此方法的兼容性为IE6+以及所有主流浏览器.<br/>
4: 此方法对传输的内容没有大小限制.所以当传输数据量过大时,可替代jsonp来使用.<br/>

#### 4) frame(targetWindow);
跨iframe交互使用，此方法返回的是一个frameHandle对象

`参数列表:`
>+ @param targetWindow   {window}  目标窗口对象

`示例用法:`

```js

 // 外部窗口代码，假设外部窗口的URI为 http://localhost:63342/index.html
  var outer = x.frame(window.frames[0]);
  outer.on('triggerOuter', function (data) {
      console.log('[LOG triggerOuter] type:frames,data: ' + JSON.stringify(data))
  });
  //⚠注意：Message事件为内置事件，接受对方通过send方法发过来的消息对象必须通过注册该事件才可收到。
  outer.on('Message', function (data) {
      console.log('[LOG Message Outer] type:frames,data: ' + JSON.stringify(data))
  });
  setTimeout(function () {
      outer.emit('triggerInner', {from: 'outer'});
      outer.send('this msg from outer');
  }, 500);
 
 // 内部窗口代码，假设内部窗口的URI为 http://cross.domain.com:3000/inner.html
   var inner = x.frame(window.parent);
  inner.on('triggerInner', function (data) {
      console.log('[LOG triggerInner] type:frames,data: ' + JSON.stringify(data))
  });
  //⚠注意：Message事件为内置事件，接受对方通过send方法发过来的消息对象必须通过注册该事件才可收到。
  inner.on('Message',function(data){
      console.log('[LOG Message Inner] type:frames,data: ' + JSON.stringify(data))
  });

  setTimeout(function(){
      inner.emit('triggerOuter', {from: 'inner'});
      inner.send('this msg from inner');
  },1000);
 
```

`注意:`<br/>
1: 此方法仅用于不同域名iframe之间交互使用，不会与服务器进行任何交互。.<br/>

#### frameHandle对象
frameHandle对象为x.frame(param...); 方法的返回值。操作ifarme之间的消息通讯必须通过此对象才可实现。<br/>
*frameHandle对象只有5个实例方法，没有静态方法。*

###### setTarget(targetWindow);
用于延迟设置目标窗口,如果调用x.frame方法时不希望立即传入目标window对象则可使用该方法.

`参数列表:`
>+ @param targetWindow      {object} 目标窗口对象

###### on(eventName, callback);
注册回调事件，以供目标window对象调用。

`参数列表:`
>+ @param eventName      {string} 方法名称
>+ @param callback     {function} 回调函数

###### emit(eventName, param);
触发对方的回调事件。

`参数列表:`
>+ @param eventName      {string} 需要触发的方法名称
>+ @param param     {object|string} 参数

###### send(message);
向对方发送消息。对方必须通过on方法注册`Message`事件才可收到通过此方法发送的消息。

`参数列表:`
>+ @param message      {string} 消息内容

###### fire(eventName, [param1,param2...]]);
触发本窗口注册的事件。

`参数列表:`
>+ @param eventName      {string} 方法名称
>+ @param [param1,param2...]]     {array} 参数列表

## 疑问?

如果您有任何疑问，请随时提出通过 [New Issue](https://github.com/YataoZhang/xMan/issues/new).

## License

xMan.js在MIT的条款下提供 [MIT License](https://github.com/YataoZhang/xMan/blob/master/LICENSE).
