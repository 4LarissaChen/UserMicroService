'use strict';
var stringUtils = require('../utils/stringUtils.js');
var arrayUtils = require('../utils/arrayUtils.js');

/**
 * Convert the split string to array
 * @param {string} splitString, can be a,b or  a\r\nb
 * @return {array}
 */
exports.convertString2Array = function(splitString) {
  if (splitString == undefined || splitString == '')
      return [];

  splitString = stringUtils.replaceAll(splitString, '\r\n', ';');
  var array = splitString.split(";");
  var convertedArray = [];
  for (var i=0; i<array.length; i++) {
    convertedArray.push(stringUtils.trim(array[i]))
  }
  return convertedArray;
}

exports.findElementNotInAnother = function(sourceArray, targetArray) {
  if(!sourceArray || !targetArray || !sourceArray.length) {
    return [];
  }
  if(!targetArray.length) {
    return sourceArray;
  }
  var result = [];
  for(var sourceIdx = 0; sourceIdx < sourceArray.length; sourceIdx++) {
    var sourceElement = sourceArray[sourceIdx];
    if(targetArray.indexOf(sourceElement) == -1) {
      result.push(sourceElement);
    }
  }
  return result;
}

exports.union = function(oneArray, anotherArray) {
  var result = [...new Set([...oneArray ,...anotherArray])]; //ES6 Functionality
  return result;
}
exports.diff = function(oneArray, anotherArray) {
  if (!anotherArray || !oneArray.length) {
    return oneArray ? oneArray : [];
  }
  if (!oneArray || !oneArray.length) {
    return [];
  }
  var result = oneArray.filter(element => anotherArray.indexOf(element) == -1);
  return result;
}

exports.intersection = function(oneArray, anotherArray) {
  if (!oneArray || !oneArray.length || !anotherArray || !anotherArray.length ) {
    return [];
  }
  var result = oneArray.filter(element => anotherArray.indexOf(element) != -1);
  return result;
}

/**
 * Get duplicate value in an array
 * @param {array} array
 * @return {string}
 */
exports.getDuplicateValue = function(array) {
  var tempArray = [];
  for (var i = 0; i < array.length; i++) {
    if(tempArray.indexOf(array[i]) == -1) {
      tempArray.push(array[i]);
    } else {
      return array[i];
    }
  };
  return "";
}

/**
 * Check if there has repeat value in an array
 * @param {array} array
 * @return {boolean}
 */
exports.checkIfHasRepeatValue = function(array) {
  var tempArray = [];
  for (var i = 0; i < array.length; i++) {
    if(tempArray.indexOf(array[i]) == -1) {
      tempArray.push(array[i]);
    } else {
      return true;
    }
  };
  return false;
}

/**
 * Copy a new array
 * @param {array<string|number>} array
 * @param {array<string|number>}
 */
exports.copy = function(array) {
  var newArray = [];
  for (var i=0; i<array.length; i++) {
    newArray[i] = array[i];
  }
  return newArray;
}

/**
 * Remove an element inside an array and return a new array
 * @param {array<string|number>} array
 * @param {string|number} element
 * @return {array<string|number>}
 */
exports.remove = function(array, element) {
  var newArray = arrayUtils.copy(array);
  var index = newArray.indexOf(element);
  if (index > -1) {
    newArray.splice(index, 1);
  }
  return newArray;
}

exports.IsContinuous = function (array) {
  if (array ==undefined || array.length < 0) {
    return false;
  }
  var min = array [0];
  var max = array [0];

  for(var i = 0; i < array.length; i++) {
    if (min > array[i]) {
      min = array[i];
    }
    if (max < array[i]) {
      max = array[i];
    }
  }

  if (max - min> array.length - 1) {
    return false;
  } else {
    return true;
  }
};

/**
 * Check if an array contains another array
 * @param {array<string|number>} array
 * @param {array<string|number>} subArray
 * @return {boolean}
 */
exports.isContained = function(array, subArray){
  if(!(array instanceof Array) || !(subArray instanceof Array)) return false;
  if(array.length < subArray.length) return false;
  for(var i=0; i<subArray.length; i++){
    if (array.indexOf(subArray[i]) == -1) return false;
  }
  return true;
}
