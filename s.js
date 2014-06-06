var fs = require('fs');

var file = fs.readFileSync('combo-cmd.js').toString();
var end = '/* ----- END OF "18/';
var plus = '" */'
var folder = '18/';

for(var i = 1; i <= 18; i++){
  for(var j = 1; j <= i; j++){
    var name = i + '-' + j + '.js';
    var files = file.split(end + name + plus);
    fs.writeFileSync(folder + name, files[0]);
    file = files[1];
  }
}