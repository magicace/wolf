const GameStep = {
    Start:      {module: 'Base', delay: 5, next: 'Dark'},       //游戏入口，自然延时5秒
    Dark:       {delay: 3, next: 'NightA'},                     //天黑了，设置游戏天计数
    Dawn:       {delay: 3},                                     //天亮了，程序判断后续流程

    NightA:     {module: 'Night',delay: 15, next: 'NightB'},    //晚上阶段A,狼人杀人阶段
    NightB:     {module: 'Night',delay: 10, next: 'Dawn'},      //晚上阶段B，预言家/守卫/女巫行动

    VotingA:    {module: 'VotingA', delay: 20, next: 'VotingB'},//投票阶段，通用
    VotingB:    {delay: 10},                                    //显示票型阶段

    ElectA:     {delay: 10},                        //玩家决定是否上警阶段
    ElectB:     {delay: 1},                         //发言组举手, 也用于平票pk准备阶段。
    ElectC:     {delay: 10, },                      //退水阶段。

    SpeechA:    {delay: 30, next: 'SpeechB'},       //发言阶段，通用
    SpeechB:    {delay: 1},                         //发言结束，通用，程序判断后续流程。

    Sheriff:    {delay: 3},                         //显示警长归属
    Result:     {delay: 3},                         //显示公投结果

    DeathNews:  {delay: 3},                         //显示夜间死亡消息。     
    LastSkill:  {module:'LastSkill', delay: 15},    //发动死亡技能
    MoveBadge:  {delay: 15},                        //移交警徽
    Order:      {delay: 10},                        //警长决定发言顺序

    EventSpeech:{module:'EventSpeech'},             //演讲事件
    EventFight: {module:'EventFight'},              //竞争事件，包括从演讲到投票以及平票pk的过程；
    EventElect: {module:'EventElect'},              //选举警长事件
    EventDeath: {module:'EventDeath'},              //死亡事件
    EventDay:   {module:'EventDay'},                //日常白天阶段

    Pause:      {module: 'Base', delay: 1},         //调试暂停

};

//基类文件设置原则：如果设置文件中如果有module项，用此项设置的名字，否则用'Step'。
///require不能容错，所以要确保要加载的文件一定存在。
let Manager = function(pSuper,stepName) {
    let data        = GameStep[stepName] || {};
    data.route      = data.route || 'on' + stepName;
    data.delay      = data.delay || 3;

    let moduleName = data.module ? data.module : 'Step';
    let stepBase = require('./steps/' + moduleName);
    let param = {
        pSuper: pSuper,
        name:   stepName,
        route:  data.route,
        delay:  data.delay,
        next:   data.next
    }

    return new stepBase(param);
}

module.exports = Manager;