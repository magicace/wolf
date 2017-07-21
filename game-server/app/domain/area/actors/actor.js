// class Actor {
//     constructor(param) {
//         this.id = param.id;
//         this.name = param.name;
//         this.icon = param.icon;
//         this.role = param.role;
//     }

//     getActMsg() {
//         return {isActStep :false};
//     }

// }

Actor = function(param) {
    this.id = param.id;
    this.name = param.name;
    this.icon = param.icon;
    this.role = param.role;
    this.pGame = param.pGame;
}

let pro = Actor.prototype;

pro.init = function(uid,sid) {
    this.uid = uid;
    this.sid = sid;
    this.isOnline = true;
}

pro.getActMsg = function(stepName) {
    return {isActStep: stepName === this.skillStep};
}

pro.setStepTarget = function(step,msg) {
    if (this.skillStep === step) {  //技能发动阶段的选择
        this.setSkillEffect(msg);
    } else {                        //投票阶段的选择
        this.setTarget(msg.target);
    }
}

pro.setSkillEffect = function(msg) {
    //设置一个空函数。不同子类里面有不同定义。
}

pro.setTarget = function(target) {
    this.target = target;
}

// pro.sendSkillMsg = function(route,stepName) {
//     let msg = this.getActMsg(stepName);
//     this.sendMsg(route,msg);    
// }

// pro.sendOwnMsg = function(route) {
//     if (this.msg !== null && this.msg !== undefined) {
//         this.sendMsg(route,this.msg);
//     }
// }

pro.sendMsg = function(route,msg) {
    if (this.isOnline) {
        let uids = [{uid:this.uid,sid:this.sid}];
        this.pGame.channelService.pushMessageByUids({route:route,msg:JSON.stringify(msg)},uids,null);
    }
}

module.exports = Actor;