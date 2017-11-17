/**
 * Copyright (c) 2016-present Alibaba Group Holding Limited
 * @author Houfeng <admin@xhou.net>
 */

// 定义获取通用路径方法
const path = require('path');
const pkg = require('../../package');
const ENV = process.env;

// 获取用户根目录
exports.homePath = function () {
  // unix || windows8+ || windows7
  return ENV.HOME ||
    ENV.USERPROFILE || (ENV.HOMEDRIVE + ENV.HOMEPATH);
};

// 获取用户数据路径
exports.dataPath = function () {
  // unix || windows
  return ENV.HOME || ENV.APPDATA || ENV.LOCALAPPDATA ||
    ENV.TMPDIR || ENV.TEMP;
};

// 此处 pkg.name 为 dawn
// 获取 .dawn 路径
exports.storePath = function () {
  // 规范化解析路径，兼容windows/unix
  return path.normalize(`${this.dataPath()}/.${pkg.name}`);
};

// 此处 pkg.name 为 dawn
// 获取 .dawnrc 的路径
exports.rcPath = function () {
  return `${this.homePath()}/.${pkg.name}rc`;
};