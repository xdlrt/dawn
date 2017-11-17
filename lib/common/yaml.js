/**
 * Copyright (c) 2016-present Alibaba Group Holding Limited
 * @author Houfeng <admin@xhou.net>
 */

const yaml = require('js-yaml');

// 解析 yaml 文本，返回 object
function parse(text) {
  return yaml.safeLoad(text, 'utf8');
}

// parse 的结果 object 转成 yaml 字符串
function stringify(obj) {
  return yaml.safeDump(obj);
}

parse.parse = parse;
parse.stringify = stringify;

module.exports = parse;