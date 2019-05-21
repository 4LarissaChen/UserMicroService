'use strict';

//Remove the string blank space
exports.trim = function(s) {
  return trimRight(trimLeft(s));
}


//Remove the string blank space in the left
var trimLeft = function(s) {
  if(s == null) {
    return "";
  }
  var whitespace = new String(" \t\n\r");
  var str = new String(s);
  if (whitespace.indexOf(str.charAt(0)) != -1) {
    var j=0, i = str.length;
    while (j < i && whitespace.indexOf(str.charAt(j)) != -1){
      j++;
    }
    str = str.substring(j, i);
  }
  return str.toString()
}

//Remove the string blank space in the right
var trimRight = function(s){
  if(s == null) return "";
  var whitespace = new String(" \t\n\r");
  var str = new String(s);
  if (whitespace.indexOf(str.charAt(str.length-1)) != -1){
    var i = str.length - 1;
    while (i >= 0 && whitespace.indexOf(str.charAt(i)) != -1){
      i--;
    }
    str = str.substring(0, i+1);
  }
  return str.toString();
}

exports.replaceAll = function(s,s1,s2){
  return s.replace(new RegExp(s1,"gm"),s2);
}

// remove html tags
exports.convertRichTextToNormal = function(richText) {
  return richText.replace(/<div/g, '\n<div').replace(/<[^>]+>/g,'');
};
