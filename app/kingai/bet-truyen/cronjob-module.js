const cron = require('cron');
const bot = require('./telegram-module');
//const bot = require('../telegram-test2'); // k push
const database = require('../../database-module');
var moment = require('moment');
const callApi = require(`../../server`)

const botId = 27;
const BOT_NAME = "Phương pháp bệt truyền";
const WIN = "WIN";
const LOSE = "LOSE";
const QUICK_ORDER = 1;
const STOPPING_STATUS = 0;
const STOP_SESSION_WIN = 1;
const STOP_SESSION_LOSE = 2;
const NOT_STOP_SESSION = 0;
const BUY = 0;
const SELL = 1;
const DRAW = 2;
const NON_QUICK_ORDER = 0;
const CAPITAL = 31;
const STOP_QUICK = 4;
const TELEGRAM_CHANNEL_ID = -1001746315808;
var isSentMessage = false;
const RUNNING_STATUS = 1;
let numQuickOrder = 0;
const SESSION_LOSE_NUM = STOP_QUICK + 1;
let orderPrice = 1;
let isQuickOrder = NON_QUICK_ORDER;
startAll();
async function startBot() {
    let timeInfo = await getCronTimeInfo();
    const job = new cron.CronJob({
        cronTime: timeInfo.cronTab,
        onTick: async function () {

            let result = await getLastDataTradding();
            let groupIds = await getGroupTelegramByBot(botId);
            if (!result) {
                if (!isSentMessage) {
                    sendToTelegram(groupIds, `BOT tạm ngưng do không lấy được dữ liệu`);
                    isSentMessage = true;
                }
                return;
            }
            isSentMessage = false;
            var dBbot = await getBotInfo(botId);
            if (dBbot.is_active === 0) {
                return;
            }
            let currentTimeSecond = new Date().getSeconds();
            if (currentTimeSecond === parseInt(timeInfo.orderSecond) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 2)) { // Vào lệnh
                var isNotOrder = false;
                const order = await getBetOder();
                if (order !== null) {
                    if (isQuickOrder === QUICK_ORDER) {
                        orderPrice = orderPrice * 2;
                    }
                }
                if (order === BUY) {
                    sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Mua \u{2B06}`);
                    insertOrder(BUY, orderPrice, isQuickOrder, botId);
                } else if (order === SELL) {
                    sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Bán \u{2B07}`);
                    insertOrder(SELL, orderPrice, isQuickOrder, botId);
                } else {
                    isNotOrder = true;
                }
                if (!isNotOrder) {
                    await sleep(1000);
                    sendToTelegram(groupIds, `Chờ kết quả \u{1F55D} !`);
                }
            }
            if (currentTimeSecond === parseInt(timeInfo.resultSecond) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 2)) { // Update kết quả, Thống kê
                var budget = dBbot.budget;
                let order = await getOrder(botId);
                if (!order) {
                    return;
                }
                // Hòa
                if (parseInt(result.result) === DRAW) {
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Hòa \u{1F4B0} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0} Vốn: ${capital}$`);
                    return;
                }
                // THẮNG
                if (parseInt(result.result) === order.orders) {
                    var interest = orderPrice * 0.95;
                    budget = roundNumber(budget + interest, 2);
                    let percent = (budget - CAPITAL) / CAPITAL * 100;
                    interest = budget - CAPITAL;
                    interest = parseFloat(interest).toFixed(2);
                    percent = parseFloat(percent).toFixed(2);
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thắng \u{1F389} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : + ${interest}$ (+${percent}%)\n\u{1F4B0}Vốn: ${CAPITAL}$`);
                    updateBugget(botId, budget);
                    insertToStatistics4KingAi(dBbot, WIN, isQuickOrder, parseInt(result.result), interest, percent, STOP_SESSION_WIN);
                    updateVolatiltyOfBot(botId, 0);
                    orderPrice = 1;
                    numQuickOrder = 0; // Chốt phiên
                    putStatistics(dBbot, groupIds);
                    isQuickOrder = NON_QUICK_ORDER;
                } else { // THUA
                    var interest = -1 * orderPrice;
                    budget = roundNumber(budget + interest, 2);
                    let percent = (budget - CAPITAL) / CAPITAL * 100;
                    interest = budget - CAPITAL;
                    interest = parseFloat(interest).toFixed(2);
                    percent = parseFloat(percent).toFixed(2);
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thua \u{274C} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : ${interest}$ (${percent}%)\n\u{1F4B0}Vốn: ${CAPITAL}$`);
                    updateBugget(botId, budget);
                    if (numQuickOrder === STOP_QUICK) {
                        putStatistics(dBbot, groupIds);
                        insertToStatistics4KingAi(dBbot, LOSE, isQuickOrder, parseInt(result.result), interest, percent, STOP_SESSION_LOSE);
                        numQuickOrder = 0; // Chốt phiên
                        isQuickOrder = NON_QUICK_ORDER;
                        orderPrice = 1;
                    } else {
                        insertToStatistics4KingAi(dBbot, LOSE, isQuickOrder, parseInt(result.result), interest, percent, NOT_STOP_SESSION);
                        numQuickOrder++;
                        isQuickOrder = QUICK_ORDER;
                    }
                }
            }
        },
        start: true,
        timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
    });
    job.start();
}

startBot();


async function getCronTimeInfo() {
    const ORDER_SETTING_TIME_KEY = "order.setting.second";
    const RESULT_SETTING_TIME_KEY = "result.setting.second";
    let orderSecond = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
    let resultSecond = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
    let cronTab = `${orderSecond.value},${resultSecond.value} * * * * *`;
    return { cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value }
}

async function putStatistics(dBbot, groupIds) {
    await sleep(1000);
    let statisticalsTimeAfterStr = [];
    let sessionNumber = dBbot.session_num;
    sessionNumber++;
    let limitStatistics = sessionNumber;
    if (limitStatistics >= 50) {
        limitStatistics = 50;
    }
    let index = sessionNumber - limitStatistics;
    await updateSessionNumAndResetCapital(dBbot.id, sessionNumber, CAPITAL);
    let statisticsMsg = [];
    statisticsMsg.push(`\u{267B} Tổng hợp ${limitStatistics} phiên gần nhất:\n`);
    let statisc = await getStatistic(dBbot.id, limitStatistics);
    statisc = statisc.reverse();
    if (!statisc) {
        return;
    }
    statisc.forEach(e => {
        if (e.is_statistics === STOP_SESSION_WIN) {
            statisticalsTimeAfterStr.push(` Phiên ${index} (${formatDateFromISO(e.created_time, "Asia/Ho_Chi_Minh")}) \u{1F389} + ${e.interest} $ (${e.percent_interest} %) \n`);
            index++;
        } else if (e.is_statistics === STOP_SESSION_LOSE) {
            statisticalsTimeAfterStr.push(` Phiên ${index} (${formatDateFromISO(e.created_time, "Asia/Ho_Chi_Minh")}) \u{274C} -${CAPITAL} $ (100%) \n`);
            index++;
        }
    });
    statisticsMsg = statisticsMsg.concat(statisticalsTimeAfterStr);
    sendToTelegram(groupIds, statisticsMsg.join(' '));
}

async function getBetOder() {
    const datas = await getLastDataTraddingByLimit(5)
    if (datas.length < 5) {
        return
    }
    if (parseInt(datas[4].result) === BUY && parseInt(datas[2].result) === BUY && parseInt(datas[0].result) === BUY) {
        return BUY
    }
    if (parseInt(datas[4].result) === SELL && parseInt(datas[2].result) === SELL && parseInt(datas[0].result) === SELL) {
        return SELL
    }
    if (parseInt(datas[4].result) === BUY && parseInt(datas[2].result) === SELL && parseInt(datas[0].result) === BUY) {
        return SELL
    }
    if (parseInt(datas[4].result) === SELL && parseInt(datas[2].result) === BUY && parseInt(datas[0].result) === SELL) {
        return BUY
    }
    return null;

}

async function getStatistic(botid, timeAfter) {
    return await database.getStatistic4KingAi(botid, timeAfter);
}

async function updateSessionNumAndResetCapital(botId, sessionNumber, capital) {
    return await database.updateSessionNumAndResetCapital(botId, sessionNumber, capital);
}

async function startAll(ms) {
    return await database.startAll();
}

async function getLastDataTraddingByLimit(limit) {
    return await database.getLastDataTraddingByLimit(limit);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function getData(ms) {
    return await database.getLastResult();
}
async function getBotInfo(botid) {
    return await database.getBotInfo(botid);
}

async function updateBugget(botid, bugdet) {
    return await database.updateBugget(botid, bugdet);
}

async function insertToStatistics4KingAi(dbBot, result, isQuickOrder, traddingData, interest, percentInterest, isStatistics) {
    // Gửi api check session tới autotrade
    const currentTime = new Date().getTime();
    await database.insertToStatistics4KingAi(dbBot.id, result, isQuickOrder, traddingData, interest, percentInterest, isStatistics);
    return callApi.sendApi4WaitLoseSignalCheck(dbBot.session_num, currentTime, dbBot.id, SESSION_LOSE_NUM);
}


function roundNumber(num, scale) {
    if (!("" + num).includes("e")) {
        return +(Math.round(num + "e+" + scale) + "e-" + scale);
    } else {
        var arr = ("" + num).split("e");
        var sig = ""
        if (+arr[1] + scale > 0) {
            sig = "+";
        }
        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
    }
}

async function insertOrder(order, price, isQuickOrder, botId) {
    return await database.insertOrder4KingAi(order, price, isQuickOrder, botId);
}

async function getOrder(botId) {
    let order = await database.getOrder(botId);
    if (!order) {
        return null;
    }
    let createdTime = new Date(order.created_time).getTime();
    let currrent = new Date().getTime();
    if ((currrent - createdTime) < 60000) { // nếu đúng là lệnh gần nhất
        return order;
    }
    return null;
}


async function updateVolatiltyOfBot(botId, volatility) {
    return await database.updateVolatiltyOfBot(botId, volatility);
}


async function getLastDataTradding() {
    let result = await getData();
    let currrent = new Date().getTime();
    if (!result) {
        return null;
    }
    if (((currrent - result.timestamp * 1000) > 35000)) { // kiểm tra trường hợp không lấy dc kết quả -> Tạm dừng
        return null;
    }
    return result;
}

async function getGroupTelegramByBot(botId) {
    return await database.getGroupTelegramByBot(botId);
}

async function sendToTelegram(groupIds, message) {
    bot.telegram.sendMessage(TELEGRAM_CHANNEL_ID, message);
    let i = 0;
    groupIds.forEach(e => {
        i++;
        setTimeout(function () {
            bot.telegram.sendMessage(e.group_id, message);
        }, 200 * i);

    });
}
function formatDateFromISO(time, zone) {
    var format = 'HH:mm:ss';
    return moment(time, format).tz(zone).format(format);
}


module.exports = '';