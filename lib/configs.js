/**
 * Copyright (c) 2016-present Alibaba Group Holding Limited
 * @author Houfeng <admin@xhou.net>
 */

const pkg = require('../package');
const fetch = require('./common/fetch');
const yaml = require('./common/yaml');
const fs = require('fs');
const path = require('path');
const readFile = require('./common/readfile');
const writeFile = require('./common/writefile');
const cache = require('./cache');
const store = require('./store');
// 控制台输出
const debug = require('debug')('config');
const console = require('console3');
const utils = require('./common/utils');
const trim = require('./common/trim');
const paths = require('./common/paths');

const FETCH_TIMEOUT = 30000;

// 设置本地配置文件
// name: 参数名
// value: 设置的值
exports.setLocalRc = async function (name, value) {
  // 获取本地配置文件
  let rcObject = await this.getLocalRc() || {};
  // 设置参数和值
  rcObject[name] = value;
  // object 转换为 yaml 字符串
  let text = yaml.stringify(rcObject);
  // 获取 .dawnrc 文件
  let rcFile = paths.rcPath();
  // 将文本写入文件
  return await writeFile(rcFile, text);
};

// 获取本地配置文件
// name: 获取的配置项，可选
exports.getLocalRc = async function (name) {
  // 获取 .dawnrc 文件
  let rcFile = paths.rcPath();
  // 若不存在此文件，返回传入的 name 参数
  if (!fs.existsSync(rcFile)) return name ? '' : {};
  // 若存在此文件，读取文件内容
  let text = await readFile(rcFile);
  // yaml 文本转换为 object
  let rcObject = yaml.parse(text) || {};
  // 若 name 不为空，返回对应配置项的值，否则返回完整的 object
  let value = name ? rcObject[name] || '' : rcObject;
  debug('getLocalRc', name || 'all', value || '<null>');
  // value 从 .dawnrc 文件中取得则返回 trim 后的字符串，否则返回完整的 object
  return utils.isString(value) ? value.trim() : value;
};

exports.getRemoteRc = async function (name) {
  let remoteRCConf = await this.getRemoteConf('rc') || {};
  let value = name ? remoteRCConf[name] || '' : remoteRCConf;
  debug('getRemoteRc', name || 'all', value || '<null>');
  return utils.isString(value) ? value.trim() : value;
};

exports.getRc = async function (name, opts) {
  opts = Object.assign({}, opts);
  let value = await this.getLocalRc(name) ||
    (opts.remote !== false && await this.getRemoteRc(name)) ||
    pkg.configs[name] || '';
  debug('getRc', name, value || '<null>');
  return utils.isString(value) ? value.trim() : value;
};

// 获取服务端配置
exports.getServerUri = async function () {
  // 从 .dawnrc 中获取 || 从 package.json 中获取 || ''
  let serverUri = await this.getLocalRc('server') ||
    pkg.configs.server || '';
  debug('getServerUri', serverUri || '<null>');
  return utils.isString(serverUri) ?
    trim(serverUri.trim(), '/') : '';
};

// 获取远端配置文件
// name: 配置文件名称
// defaultValue: 配置文件默认内容
exports.getRemoteConf = async function (name, defaultValue) {
  // 获取缓存中的配置
  let cacheInfo = await cache.get(name);
  // 若配置文件存在且未过期，则返回 yaml 解析后生成的 object 
  if (cacheInfo.isExists && !cacheInfo.isExpire) {
    return yaml(cacheInfo.value);
  }
  // 若配置文件不存在或已过期，则从远端获取
  let serverUri = await this.getServerUri();
  // 远端 url
  let url = `${serverUri}/${name}.yml`;
  debug('Remote conf URI:', url);
  let res;
  try {
    // 获取远端文件
    res = await fetch(url, { timeout: FETCH_TIMEOUT });
  } catch (err) {
    console.warn(err.message);
    // 若出现异常且缓存中配置存在，则返回缓存中的配置，否则返回 defaultValue
    return (cacheInfo.isExists ? yaml(cacheInfo.value) : defaultValue) || {};
  }
  // 若http请求状态码不为正确响应状态且缓存中配置存在，则返回缓存中的配置，否则返回 defaultValue
  if (res.status < 200 || res.status > 299) {
    return (cacheInfo.isExists ? yaml(cacheInfo.value) : defaultValue) || {};
  }
  // 获取结果中的内容
  let text = await res.text();
  // 设置本地缓存中对应的文件
  await cache.set(name, text);
  return yaml(text);
};

// 获取本地配置文件
// name: 配置文件名称
// defaultValue: 配置文件默认内容
exports.getLocalConf = async function (name, defaultValue) {
  // 获取 configs 文件夹路径
  let localStoreDir = await store.getPath('configs');
  // 获取配置文件路径
  let filename = path.normalize(`${localStoreDir}/${name}.json`);
  // 若配置文件不存在，返回 defaultValue
  if (!fs.existsSync(filename)) return defaultValue || {};
  // 读取配置文件内容
  let text = await readFile(filename);
  return JSON.parse(text);
};

// 设置本地配置
// name: 配置文件名称
// value: 要设置的配置文件内容
exports.setLocalConf = async function (name, value) {
  // 获取 configs 文件夹路径
  let localStoreDir = await store.getPath('configs');
  // 获取配置文件路径
  let filename = path.normalize(`${localStoreDir}/${name}.json`);
  let text = JSON.stringify(value);
  // 写入配置内容
  await writeFile(filename, text);
};