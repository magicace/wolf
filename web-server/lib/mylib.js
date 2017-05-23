var lib =  {
    //在输入的最小值到最大值闭区间:[min,max]中取随机整数。
    //如省略第二个参数，将在闭区间：[0, min]中取随机整数。
    rand:   function(min,max) {
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

    //加权随机，t为权重数组。
    //返回序号
    weightRand: function(t) {
        let v= [];
        let cnt = 0;
        for (let i in t) {
            cnt += t[i];
            v.push(cnt);
        }

        let idx = 0;
        let num = this.rand(1,cnt);
        for (let i in v) {
            if (num <= v[i]) {
                idx = i;
                break;
            }
        }

        return idx;
    },
    
    //Fisher-Yate洗牌算法,参数t为数组。
    shuffle:  function(t) {
        let len = t.length;
        for (let i = 0; i < len; ++i) {
            let j = this.rand(len-1);
            let tmp = t[i];
            t[i] = t[j];
            t[j] = tmp;
        }
        return t;
    },
    
    mergeArray: function(des,src) {
        let len = src.length;
        for (let i = 0; i<len; ++i) {
            des.push(src.pop());
        }
    },  
};

module.exports = lib;