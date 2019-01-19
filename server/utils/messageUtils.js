'use strict'

var fs = require('fs');
var moment = require('moment');
var Promise = require('bluebird');
var SMSClient = require('@alicloud/sms-sdk');
var errorMessage = require('../constants/errorConstants.js');
var config = JSON.parse(fs.readFileSync(global.appRoot + 'server/config.json')).features.SMSConfig;

var _getSMSClient = function () {
  return new SMSClient(config.accessKey);
}

exports.sendMessage = function (tel, code, option) {

  let smsClient = _getSMSClient();
  return smsClient.sendSMS({
    PhoneNumbers: tel,
    SignName: '布查德鲜花',
    TemplateCode: config.messageTemplate[option],
    TemplateParam: '{"code":"' + code + '"}'
  }).then(res => {
    let { Code } = res;
    if (Code === 'OK') {
      //处理返回参数
      return Promise.resolve();
    } else if (errorMessage.SMS_SERVICE_ERROR_CODE[Code])
      throw (new Error(errorMessage.SMS_SERVICE_ERROR_CODE[Code]));
    else
      return Promise.reject(err);
  })
}

exports.querySentMessage = function (tel, code) {

  let smsClient = _getSMSClient();
  return smsClient.queryDetail({
    PhoneNumber: tel,
    SendDate: moment().format("YYYYMMDD"),
    PageSize: '1',
    CurrentPage: "1"
  }).then(res => {
    if (res.Code === 'OK') {
      //处理发送详情内容
      if (res.SmsSendDetailDTOs.SmsSendDetailDTO[0].Content.indexOf(code) != -1)
        return Promise.resolve();
    }
    else
      throw (new Error('验证失败，请重新尝试！'))
  });
}