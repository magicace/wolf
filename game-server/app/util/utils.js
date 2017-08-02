var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if(!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function(origin) {
  if(!origin) {
    return;
  }

  var obj = {};
  for(var f in origin) {
    if(origin.hasOwnProperty(f)) {
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function(obj) {
  if(!obj) {
    return 0;
  }

  var size = 0;
  for(var f in obj) {
    if(obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack){
  return stack[1].getLineNumber();
}

utils.myPrint = function() {
  if (isPrintFlag) {
    var len = arguments.length;
    if(len <= 0) {
      return;
    }
    var stack = getStack();
    var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
    for(var i = 0; i < len; ++i) {
      aimStr += arguments[i] + ' ';
    }
    console.log('\n' + aimStr);
  }
};
// print the file name and the line number ~ end

//在输入的最小值到最大值闭区间:[min,max]中取随机整数。
//如省略第二个参数，将在闭区间：[0, min]中取随机整数。
utils.rand = function(min,max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    
    let rtn = min;
    let len = max - min + 1;

    if (len >0) {
        rtn += Math.floor(Math.random() * len);
    }
    return rtn;
},
/**
 *  Fisher-Yate Shuffle Algorithm
 *  Added by Ace 2017-6-12
 * @param t array of any
 * @return new confused array
 */
utils.shuffle = function(t) {
      let len = t.length;
      for (let i = 0; i < len; ++i) {
          let j = this.rand(len-1);
          let tmp = t[i];
          t[i] = t[j];
          t[j] = tmp;
      }
      return t;
}

/**
 * Remove the first one member from array
 * @param array the array
 * @param value the value of the member you want to remove
 * @return the value if success or null;
 */
utils.removeFromArray = function(array,value) {
  let index = null;
  for (i=0; i<array.length; ++i) {
    if (array[i] === value) {
      index = i;
      break;
    }
  }

  if (index !== null) {
    return array.splice(index,1);
  } else {
    return null;
  }
}

/**
 * Insert a unique value into array
 * @param array the array
 * @param value the value you want to insert
 * @return if insert or not 
 */
// utils.uniqPushArray = function(array,value) {
//   let isUniq = true;
//   for (let i in array) {
//     if (array[i] === value) {
//       isUniq = false;
//       break;
//     }
//   }

//   if (isUniq) {
//     array.push(value);
//   }

//   return isUniq;
// }


utils.findNextId = function(idGroup,srcId,isAscent) {
    console.log('======================================= !!!');
    console.log(idGroup,srcId,isAscent);
    if (isAscent === undefined) {
        isAscent = true;
    }

    let findId;
    let len = idGroup.length;

    if (!srcId) {   //没有初始位置，随机产生一个开始位置
        let index = this.rand(len - 1);
        findId = idGroup[index];
    } else {
        if (len <= 1) {
            findId = null;
        } else {
            //找到srcId在群组中的位置
            let index = null;
            for (let i=0; i<len; ++i) {  
                if (idGroup[i] === srcId) {
                    index = i;
                    break;
                }
            }

            // 这里判断条件不能用（！index)，因为 ！0 = true;
            if (index === null) {   //异常情况，正常不应该出现，一定是程序逻辑有什么地方有问题。
                console.log('===================, cannot find the srcId !!!');
                return null;
            }

            index += isAscent ? 1 : -1;
            if (index < 0) {
                index = len - 1;
            } else if (index === len) {
                index = 0;
            }

            findId = idGroup[index];
        }
    }

    return findId;
}

