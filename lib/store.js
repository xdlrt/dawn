/**
 * Copyright (c) 2016-present Alibaba Group Holding Limited
 * @author Houfeng <admin@xhou.net>
 */

const path = require('path');
const del = require('del');
const mkdirp = require('./common/mkdirp');
const paths = require('./common/paths');

// 获取文件夹路径
// name: 文件夹
exports.getPath = async function (name) {
  // 获取 .dawn 文件夹路径
  let storePath = paths.storePath();
  // 获取文件夹路径
  let storeItemPath = path.normalize(`${storePath}/${name || ''}`);
  // 递归创建目录和文件
  await mkdirp(storeItemPath);
  return storeItemPath;
};

exports.clean = async function (name) {
  let storePath = paths.storePath();
  if (name) storePath += `/${name}`;
  await del([`${storePath}/**/*.*`], {
    force: true
  });
};