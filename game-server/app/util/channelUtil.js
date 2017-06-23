let ChannelUtil = module.exports;

const GLOBAL_CHANNEL_NAME = 'pomelo';
const AREA_CHANNEL_PREFIX = 'area_';
const TEAM_CHANNEL_PREFIX = 'team_';
const ROOM_CHANNEL_PREFIX = 'room_';
const WOLF_CHANNEL_PREFIX = 'wolf_';

ChannelUtil.getGlobalChannelName = function() {
  return GLOBAL_CHANNEL_NAME;
};

ChannelUtil.getAreaChannelName = function(areaId) {
  return AREA_CHANNEL_PREFIX + areaId;
};

ChannelUtil.getTeamChannelName = function(teamId) {
  return TEAM_CHANNEL_PREFIX + teamId;
};

ChannelUtil.getRoomChannelName = function(roomId) {
  return ROOM_CHANNEL_PREFIX + roomId;
};

ChannelUtil.getWolfChannelName = function(roomId) {
  return WOLF_CHANNEL_PREFIX + roomId;
};

