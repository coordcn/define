# define

javascript module loader. like [seajs](http://seajs.org/)

把seajs的原理弄明白了，自己实现了一个，跟seajs还是有不一样的地方。seajs强调模块id和路径匹配原则，当文件和模块一一对应的时候，这个原则是很好理解的，但是当一个文件对应多个模块的时候，这个时候id和路径匹配原则就不是太好理解了。我的处理方式，当id和模块一一对应时，按照id索引路径，当不能一一对应时，手工编写id2uri索引文件。这个方式其实是比较难看的，需要人工参与，跟seajs比还是不够省力，但是相对容易理解。

## download
https://github.com/coordcn/define/

## document

### 模块定义
### define(id, deps, factory, [immediate]) 
### define(id, factory, [immediate])
*@param id {string} id参数必须提供，不支持匿名模块
*@param deps {array[string]} 模块依赖的id数组
*@param factory {function} function(require, exports, module){}
*@param immediate {boolean} 模块加载后是否立即执行，默认不立即执行

建议书写形式

```js

(function(factory){
  define('name',
    [
      'deps1',
      'deps2'
    ],
    factory,
    true
  );
})(function(require, exports, module){
});

```

### 模块使用
### use(deps, callback) === define('somename', deps, callback, true)
*@param deps {array[string]} 模块依赖的id数组
*@param callback {function} function(require){}
