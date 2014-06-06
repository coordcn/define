# define

javascript module loader. like [seajs](http://seajs.org/)

把seajs的原理弄明白了，自己实现了一个，跟seajs还是有不一样的地方。seajs强调模块id和路径匹配原则，当文件和模块一一对应的时候，这个原则是很好理解的，但是当一个文件对应多个模块的时候，这个时候id和路径匹配原则就不是太好理解了。我的处理方式，当id和模块一一对应时，按照id索引路径，当不能一一对应时，手工编写id2uri索引文件。这个方式其实是比较难看的，需要人工参与，跟seajs比还是不够省力，但是相对容易理解。

## download
https://github.com/coordcn/define/

## document

### 模块定义
### @param id {string} 
### @param deps {array[string]} ids
### @param factory {function}
###   function(require, exports, module){}
### @param 
### define(id, deps, factory, [immediate]) 
### define(id, factory, [immediate])

### 模块使用 其实是模块定义的一个快捷方式
### use(deps, callback) === define('somename', deps, callback, true)

