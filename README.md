xMan
============

## xMan中文文档
*一个通用的跨域解决方案*

`xMan`是一个高效的,轻量,易用(整个类库加上扩展方法一共只有10个API),兼容性很强的的跨域帮助库.支持ie6+以上以及所有主流的高级浏览器,提供get和post方法两种跨域方式.
使用`xMan`可以让你的代码实现无缝跨域逻辑的实现.`xMan`竭尽所能的提供各种方法并尽力精简了以下的跨域方法,以便可以让开发者更好的进行跨域操作.

你可以在遵守 MIT Licence 的前提下随意使用并分发它。`xMan` 代码完全开源并托管在 Github 上。

### xMan的引入
```html

  <script type="text/javascript" src="./xMan.js"></script>
    
```
### xMan如何向外暴露(兼容AMD和CMD)

xMan在生成是先行检测并依附于全局环境中的`exports`和`module`,如果没有的该属性则再次检索依附于`define`和`define.amd`,如果上述两种情况都不存在便依附于`window`.依顺序逐个依附.

```js

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

该类库提供的方法皆为异步方法.使用时可直接用x.方法名(parma[...]).使用该方法.如下:

```js

  // 本事例仅做演示.
    
  x.jsonp('http://localhost:3000/jsonp', {type: 'jsonp'}, 'cb', function (data) {
      console.log('[LOG] type:jsonp,data: ' + JSON.stringify(data));
  });

  x.crossDomain('post', 'http://localhost:3000/cors', {type: 'cors'}, function (data) {
      console.log('[LOG] type:cors,data: ' + JSON.stringify(data));
  });

  x.formRequest('post', 'http://localhost:3000/form', {type: 'form'}, function (data) {
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

#### 1) jsonp(url, data, jsonpName, callback);
此方法提供是jsonp功能.

`参数列表:`
>+ @param url         {string} 请求路径
>+ @param data        {string | object} 发送数据
>+ @param jsonpName   {string} 回调函数名称
>+ @param callback    {function} 回调函数
  
`示例用法:`

```js

 x.jsonp('http://localhost:3000/jsonp', {type: 'jsonp'}, 'cb', function (data) {
     console.log('[LOG] type:jsonp,data: ' + JSON.stringify(data));
 });
    
```

`注意:`<br/>
1: 此方法只能为`GET`方法.<br/>
2: 此方法请求数据有大小限制.(chrome为8k,firefox为7k,ie为2k)<br/>
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
 x.crossDomain('post', 'http://localhost:3000/cors', {type: 'cors'}, function (data) {
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
  x.formRequest('post', 'http://localhost:3000/form', {type: 'form'}, function (data) {
       console.log('[LOG] type:form,data: ' + JSON.stringify(data));
  },'application/x-www-form-urlencoded');
 
 // server代码(仅以nodejs为例)
  var content = 'server数据' 
  var header = {
       'content-type': 'text/html',
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

## 此解决方案支持跨域get和post方法。
#### 提供四种方法，模仿jQuery，简单可依赖。

>+   jsonp  (仅支持get方法)  市面上浏览器都支持
>+   iframe  (window.name|[on/post]message)  仅支持get方法 市面上浏览器都支持
>+   cors  (支持get 和 post方法)  仅支持ie8+以及高级浏览器
>+   form  iframe (支持get方法和post方法)  市面上浏览器都支持
