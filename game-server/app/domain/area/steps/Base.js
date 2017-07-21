//游戏步骤控制最基类，基类Step的基类
//只有最基本的循环控制的内容，不包含消息处理。
Base = function(param) {
    this.pGame  = param.pGame;
    this.name   = param.name;
    this.delay  = param.delay;
    this.route  = param.route;
    this.next   = param.next;
}

module.exports = Base;
let pro = Base.prototype;

pro.begin = function() {
}

pro.end = function() {
}

pro.getNext = function() {
    return this.next;
}

pro.getInterval = function() {
    return this.delay * 1000;
}