/** 
  @copyright Copyright (C) 2014 coord.cn All rights reserved. 
  @overview 模块
  @author Qian ye(coordcn@163.com)
 */

/**
  @overview 
    require(id) 引用的ID
    deps[id] 依赖的ID
    开发模式：一个模块对应一个文件
    发布模式：一个文件包含n个模块，文件与模块的关系由id2uri手动指定，如果未指定，则默认模块与文件对应。
 */
(function(global, undefined){
  var modules = {};
  var files = {};
  var prifix = 'coordcn';
  var useIndex = 0;
  /**id2uri**/
  var id2uri = null;
  
  function isType(type){
    return function(obj){
      return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    }
  }
  
  var isObject = isType('Object');
  var isString = isType('String');
  var isArray = Array.isArray || isType('Array');
  var isFunction = isType('Function');
  var isBoolean = isType('Boolean');
  
  var doc = document;
  var head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
  
  function request(url, callback, charset){
    var script = doc.createElement('script');
    script.async = true;
    script.src = url;
    script.charset = charset || 'utf-8';
    script.onload = script.onreadystatechange = function(){
      if(!script.readyState || /loaded|complete/.test(script.readyState)){
        removeScript();
        callback();
      }
    };
    script.onerror = function(){
      removeScript();
      throw Error('Script[' + url + '] load error.');
    };
    
    function removeScript(){
      script.onload = script.onreadystatechange = script.onerror = null;
      head.removeChild(script);
      script = null;
    }
    
    head.insertBefore(script, head.firstChild);
  }
  
  /**
    @class File
    @param uri {string} uri = 'lib/tasks'
   */
  var FILE_STATUS = {
    LOADING: 1,
    LOADED: 2
  };
  
  function File(uri){
    this.uri = uri;
    this.status = 0;
  }
  
  File.prototype.load = function(requestCache){
    if(this.status >= FILE_STATUS.LOADING){
      return;
    }
    
    this.status = FILE_STATUS.LOADING;
    
    if(requestCache){    
      requestCache.push(sendRequest);
    }else{
      sendRequest();
    }
    
    var self = this;
    function sendRequest(){
      request(self.uri, function(){
        self.status = FILE_STATUS.LOADED;
      });
    }
  };
  
  File.get = function(uri){
    return files[uri] || (files[uri] = new File(uri));
  };
  
  function getUriById(id){
    if(id2uri){
      if(id2uri[id]){
        return id2uri[id];
      }
      
      return id;
    } 
    
    return id;
  }
  
  function Module(id, deps, factory){
    this.id = id;
    this.deps = deps || [];
    this.factory = factory;
    this.exports = null;
    this.ready = false;
    this.excuted = false;
    this.depsLoadedEvents = [];
  }
  
  // load deps
  Module.prototype.loadDeps = function(){
    var deps = this.deps;
    var uris = [];
    var length = deps.length;
    for(var i = 0; i < length; i++){
      var uri = getUriById(deps[i]);
      uris[i] = (uri.substring(uri.length -3) === '.js') ? uri : uri + '.js';
    }

    var completed = 0;
    var self = this;
    for(var i = 0; i < length; i++){
      var mod = Module.get(deps[i]);
      if(mod.ready){
        completed++;
      }else{
        mod.addDepsLoadedEvent(function(){
          completed++;
          if(completed >= length){
            self.onDepsAllLoaded();
          }
        });
      }
    }
    
    if(completed >= length){
      self.onDepsAllLoaded();
      return;
    }

    var requestCache = []; 
    for(var j = 0; j < length; j++){
      var file = File.get(uris[j]);
      file.load(requestCache);
    }
    
    for(var k = 0, l = requestCache.length; k < l; k++){
      requestCache[k]();
    }
  };
  
  function require(id){
    return Module.get(id).exec();
  }
  
  // All deps loaded
  Module.prototype.onDepsAllLoaded = function(callback){
    var mod = this;
    mod.ready = true;
    
    if(mod.callback){
      mod.callback(require);
    }
    
    var events = mod.depsLoadedEvents;
    for(var i = 0, l = events.length; i < l; i++){
      events[i]();
    }
    delete mod.depsLoadedEvents;
  };
  
  Module.prototype.addDepsLoadedEvent = function(callback){
    this.depsLoadedEvents.push(callback);
  };
  
  Module.prototype.exec = function(){
    var mod = this;

    if(mod.excuted){
      return mod.exports;
    }

    mod.factory(require, mod.exports = {}, mod);
    
    delete mod.factory;
    mod.excuted = true;

    return mod.exports;
  };
  
  Module.get = function(id, deps, factory){
    return modules[id] || (modules[id] = new Module(id, deps, factory));
  };
  
  /**
    @param id {string} 模块的唯一标识
    @param deps {array[string]} 
    @param factory {function} 
    @param immediate {bool} 模块加载完成后是否立即执行
    @example
      文件util.js
      define('util', [],
        function(require, exports, module){
        }
      );
      文件lang.js
      define('lib/lang', [],
        function(require, exports, module){
        }
      );
      文件tasks.js
      define('lib/tasks/parallel',
        ['util', 'lib/lang'],
        function(require, exports, module){
        }
      )
      define('lib/tasks/series',
        ['util', 'lib/lang'],
        function(require, exports, module){
        }
      )
      文件dom.js
      define(
        'lib/dom',
        [
          'lib/tasks',
          'lib/lang',
          'util'
        ],
        function(require, exports, module){
          var parallel = require('lib/tasks/parallel');
          var series = require('lib/tasks/series');
          var util = require('util');
          var lang = require('lib/lang');
        }
      );
   */
  function define(id, deps, factory, immediate){
    var argsLength = arguments.length;
    if(argsLength === 1){
      throw Error('define(id, deps, factory, immediate) define(id, deps, factory) define(id, factory) define(id, factory, immediate)');
    }
    
    if(argsLength === 2){
      if(!isString(id)){
        throw Error('define(id, factory) id must be string.');
      }
      
      factory = deps;
      deps = undefined;
      
      if(!isFunction(factory)){
        throw Error('define(id, factory) factory must be function.');
      }
      
      immediate = false;
    }
    
    if(argsLength === 3){
      if(!isString(id)){
        throw Error('define(id, deps, factory) id must be string.');
      }
      
      if(isFunction(deps)){
        factory = deps;
        deps = undefined;
        immediate = factory;
        if(!isBoolean(immediate)){
          throw Error('define(id, factory, immediate) immediate must be boolean.');
        }
      }else{
        if(!isArray(deps)){
          throw Error('define(id, deps, factory) deps must be array.');
        }
        
        if(!isFunction(factory)){
          throw Error('define(id, deps, factory) factory must be function.');
        }
        
        immediate = false;
      }
    }
    
    if(argsLength === 4){
      if(!isString(id)){
        throw Error('define(id, deps, factory, immediate) id must be string.');
      }
      
      if(!isArray(deps)){
        throw Error('define(id, deps, factory, immediate) deps must be array.');
      }
      
      if(!isFunction(factory)){
        throw Error('define(id, deps, factory, immediate) factory must be function.');
      }
      
      if(!isBoolean(immediate)){
        throw Error('define(id, deps, factory, immediate) immediate must be boolean.');
      }
    }

    var mod = Module.get(id, deps, factory);
    mod.id = id;
    mod.deps = deps;
    mod.factory = factory;
    if(immediate){
      mod.callback = factory;
    }
    
    mod.loadDeps();
  }
  
  function use(deps, callback){
    var argsLength = arguments.length;
    if(argsLength === 1){
      callback = deps;
      if(!isFunction(callback)){
        throw Error('use(callback) callback must be function.');
      }
      
      callback();
      return;
    }
    
    useIndex++;
    var id = prifix + useIndex;
    define(id, deps, callback, true);
  }
  
  global.define = define;
  global.use = use;
})(this);