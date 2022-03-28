const axios = require("axios");
const url = "http://localhost:5555/api/trade/v1/auto-bet";
module.exports.sendApiToCopyTrade =  function (order, price, isQuickOrder, botId) {
  let betType = null;
  if (order === 0) {
    betType = "UP";
  } else if (order === 1) {
    betType = "DOWN";
  }
  let data = {
    betType: betType,
    betAmount: price,
    betAccountType: "DEMO",
    botId: botId,
    percent: price,
  };
  axios
    .post(url, data)
    .then(function (response) {
      //console.log(response);
    })
    .catch(function (error) {
      //console.log(error);
    });
}

const urlCheckWaitLose = "http://localhost:5555/api/trade/v1/method-setting";
module.exports.checkWaitLose =  function () {
  axios
    .post(urlCheckWaitLose)
    .then(function (response) {
      
    })
    .catch(function (error) {
      console.log(error);
    });
}

const urlTradeVolume = "http://localhost:5555/api/trade/v1/volume-bet";
module.exports.sendApiToTradeVolume =  function () {
  axios
    .post(urlTradeVolume)
    .then(function (response) {
      
    })
    .catch(function (error) {
      console.log(error);
    });
}

const urlBet4Mix = "http://localhost:5555/api/trade/v1/bet-4-mix";
module.exports.sendApiBotSetting =  function () {
  axios
    .post(urlBet4Mix)
    .then(function (response) {
      //console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
}