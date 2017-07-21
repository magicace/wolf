const GameStep = {
    Start:      {module: 'Base', delay: 5, next: 'Dark'},       //游戏入口，自然延时5秒
    Dark:       {delay: 3, next: 'NightA'},                     //天黑了，设置游戏天计数
    NightA:     {module: 'Night',delay: 15, next: 'NightB'},    //晚上阶段A,狼人杀人阶段
    NightB:     {module: 'Night',delay: 10, next: 'Dawn'},      //晚上阶段B，预言家/守卫/女巫行动
    
    Dawn:       {delay: 3},                         //天亮了，程序判断后续流程
    ElectA:     {delay: 11, next: 'ElectB'},        //玩家决定是否上警阶段
    ElectB:     {delay: 1, next:'SpeechA'},         //显示上警情况
    SpeechA:    {delay: 30, next:'SpeechB'},        //发言阶段，通用
    SpeechB:    {delay: 1},                         //发言结束，通用，程序判断后续流程。

    ElectC:     {delay: 10, next: 'VotingA'},                   //退水阶段
    VotingA:    {module: 'VotingA', delay: 20, next: 'VotingB'},//投票阶段
    VotingB:    {delay: 10, next:'Result'},                     //显示票型阶段
    Result:     {/*module: 'Result' ,*/delay: 5},              //显示投票结果阶段

    Pause:      {module: 'Base', delay: 1},         //调试暂停

};

    
//     Result: {sec:10,next:'Pause'},              //显示结果阶段
//     LastWords: {sec:61,next:'NightA'},          //遗言阶段
//     ShowDead: {sec: 15, /*next:'SpkOrder'*/},   //显示夜里死亡清单
//     SpkOrder: {sec: 15, next:'SpeechA'},        //有警长时候，警长决定发言顺序

//     Pause: {sec:1}


//基类文件设置原则：如果设置文件中如果有module项，用此项设置的名字，否则用'Step'。
///require不能容错，所以要确保要加载的文件一定存在。
let Manager = function(pGame,stepName) {
    let data        = GameStep[stepName] || {};
    data.route      = data.route || 'on' + stepName;
    data.delay      = data.delay || 3;

    let moduleName = data.module ? data.module : 'Step';
    let stepBase = require('./steps/' + moduleName);
    let param = {
        pGame:  pGame,
        name:   stepName,
        route:  data.route,
        delay:  data.delay,
        next:   data.next
    }

    return new stepBase(param);
}

module.exports = Manager;