const cron = require('cron');
const bot = require('./telegram-module');
//const bot = require('../telegram-test2'); // k push
const database = require('../database-module');
var moment = require('moment');


// var message = "\u{1F600} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{1F359} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B06} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B07} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n"
// message += "\u{1F55D} Đồng hồ, \u{2B06}  Tăng , \u{2B07} Giảm ,\u{1F389} Thắng , \u{274C} Thua , \u{267B} Thống kê, \u{1F4B0} Tiền";
//bot.telegram.sendMessage(-516496456, message);
// Link unicode của icon telegram : https://apps.timwhitlock.info/emoji/tables/unicode

//const TELEGRAM_CHANNEL_ID = -1001546623891; // group test

const botId = 4;
const BOT_NAME = "Bot tín hiệu 4";
const STOPPING_STATUS = 0;
const capital = 100;
const WIN = "WIN";
const LOSE = "LOSE";
const NOT_ORDER = "NOT_ORDER";
const STATISTIC_TIME_AFTER = 10;
const NON_QUICK_ORDER = 0;
const QUICK_ORDER = 1;
const STOP_SESSION_WIN = 1;
const STOP_SESSION_LOSE = 2;
const NOT_STOP_SESSION = 0;
const BUY = 0;
const SELL = 1;
const DRAW = 'DRAW';
const CAPITAL = 15;
const TELEGRAM_CHANNEL_ID = -1001546623891;
//const TELEGRAM_CHANNEL_ID = -1001787581503;
let numQuickOrder = 0;
let isQuickOrder = NON_QUICK_ORDER;
var isSentMessage = false;
let orderPrice = 1;
const STOP_QUICK = 3;
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

            lastStatistics = await getLastStatistics(botId);
            if (!lastStatistics) {
                insertToStatistics(botId, NOT_ORDER, 0, 0, 0);
                return;
            }

            let currentTimeSecond = new Date().getSeconds();

            isFirst = false;
            if (currentTimeSecond === parseInt(timeInfo.orderSecond) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 2)) { // Vào lệnh
                if (isQuickOrder === QUICK_ORDER) {
                    orderPrice = orderPrice * 2;
                }
                if (isQuickOrder === QUICK_ORDER) {
                } else if (!database.checkRowOneForOrder()) {
                    return;
                }
                var isNotOrder = false;
                if (isQuickOrder === NON_QUICK_ORDER) { // lệnh thường -> đánh theo hàng 1
                    if (lastStatistics.tradding_data === BUY) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Mua \u{2B06}`);
                        insertOrder(BUY, orderPrice, isQuickOrder, botId);
                    } else if (lastStatistics.tradding_data === SELL) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Bán \u{2B07}`);
                        insertOrder(SELL, orderPrice, isQuickOrder, botId);
                    } else {
                        isNotOrder = true;
                    }
                } else if (isQuickOrder === QUICK_ORDER) { // Lệnh gấp-> đánh theo lệnh vừa thua
                    let lastOrder = await getLastOrder(botId);
                    if (lastOrder.orders === BUY) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Mua \u{2B06}`);
                        insertOrder(BUY, orderPrice, isQuickOrder, botId);
                    } else if (lastOrder.orders === SELL) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Bán \u{2B07}`);
                        insertOrder(SELL, orderPrice, isQuickOrder, botId);
                    } else {
                        isNotOrder = true;
                    }
                }
                if (!isNotOrder) {
                    await sleep(1000);
                    sendToTelegram(groupIds, `Chờ kết quả \u{1F55D} !`);
                }
            }

            if (currentTimeSecond === parseInt(timeInfo.resultSecond) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 2)) { // Update kết quả, Thống kê
                var budget = dBbot.budget;
                if (database.checkRowOneForStatistic() && isQuickOrder === NON_QUICK_ORDER) {
                    insertToStatistics(botId, NOT_ORDER, 0, parseInt(result.result), 0);
                    return;
                }

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
                    var interest = orderPrice - orderPrice * 0.05;
                    let percent = interest / CAPITAL * 100;
                    percent = parseFloat(percent).toFixed(2);
                    budget = roundNumber(budget + interest, 2);
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thắng \u{1F389} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : + ${interest}$ (+${percent}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    insertToStatistics4KingAi(botId, LOSE, isQuickOrder, parseInt(result.result), interest, STOP_SESSION_WIN);
                    updateVolatiltyOfBot(botId, 0);
                    orderPrice = 1;
                    numQuickOrder = 0; // Chốt phiên
                    putStatistics(dBbot, groupIds);
                    isQuickOrder = NON_QUICK_ORDER;
                } else { // THUA
                    var interest = -1 * orderPrice;
                    budget = roundNumber(budget + interest, 2);
                    let percent = interest / CAPITAL * 100;
                    percent = parseFloat(percent).toFixed(2);
                    var percentInterest = interest / capital * 100;
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thua \u{274C} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : ${interest}$ (${percent}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    insertToStatistics4KingAi(botId, LOSE, isQuickOrder, parseInt(result.result), interest, NOT_STOP_SESSION);
                    console.log(`numQuickOrder ${numQuickOrder}`);
                    if (numQuickOrder === STOP_QUICK) {
                        putStatistics(dBbot, groupIds);
                        console.log(`CHOOTS PHIEN`);
                        insertToStatistics4KingAi(botId, LOSE, isQuickOrder, parseInt(result.result), percentInterest, STOP_SESSION_LOSE);
                        numQuickOrder = 0; // Chốt phiên
                        isQuickOrder = NON_QUICK_ORDER;
                        orderPrice = 1;
                    } else {
                        numQuickOrder++;
                        isQuickOrder = QUICK_ORDER;
                    }

                }
                // Thống kê sau n lệnh
                await sleep(5000);
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
    console.log(dBbot);
    let statisticalsTimeAfterStr = [];
    let sessionNumber = dBbot.session_num;
    let index = 0;
    sessionNumber++;
    let limitStatistics = sessionNumber;
    if (limitStatistics >= 50) {
        limitStatistics = 50;
    }
    await updateSessionNumAndResetCapital(dBbot.id, sessionNumber, CAPITAL);
    let statisticsMsg = [];
    statisticsMsg.push(`\u{267B} Tổng hợp ${limitStatistics} phiên gần nhất:\n`);
    let statisc = await statisticDay(dBbot.id, limitStatistics);
    console.log(statisc);
    
    if (!statisc) {
        console.log(`STOP thống kê `);
        return;
    }
    statisc.forEach(e => {

        if (e.is_statistics === STOP_SESSION_WIN) {
            let percent = e.interest / CAPITAL * 100;
            percent = parseFloat(percent).toFixed(2);
            statisticalsTimeAfterStr.push(`Phiên ${sessionNumber - index} (${formatDateFromISO(e.created_time)}) \u{1F389}  + ${e.interest} $ (${percent} %) \n`);
            index++;
        } else if (e.is_statistics === STOP_SESSION_LOSE) {
            statisticalsTimeAfterStr.push(`Phiên ${sessionNumber - index} (${formatDateFromISO(e.created_time)}) \u{274C} \u{1F4B0} -${CAPITAL} $ (100%) \n`);
            index++;
        }
    });
    statisticsMsg = statisticsMsg.concat(statisticalsTimeAfterStr);
    sendToTelegram(groupIds, statisticsMsg.join(' '));
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

async function updateSessionNumAndResetCapital(botId, sessionNumber, capital) {
    return await database.updateSessionNumAndResetCapital(botId, sessionNumber, capital);
}

async function updateBugget(botid, bugdet) {
    return await database.updateBugget(botid, bugdet);
}

async function insertToStatistics(botid, result, isQuickOrder, traddingData, interest) {
    return await database.insertToStatistics(botid, result, isQuickOrder, traddingData, interest);
}

async function insertToStatistics4KingAi(botid, result, isQuickOrder, traddingData, interest, isStatistics) {
    return await database.insertToStatistics4KingAi(botid, result, isQuickOrder, traddingData, interest, isStatistics);
}


async function getLastStatistics(botid) {
    return await database.getLastStatistics(botid);
}

async function updateStatusForStatistics(botId) {
    return await database.updateStatusForStatistics(botId);
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

async function statistic(botid, timeAfter) {
    return await database.statistic(botid, timeAfter);
}

async function statisticDay(botid, timeAfter) {
    return await database.statisticDay(botid, timeAfter);
}

function formatDateFromISO(date) {
    return moment(date.toString()).format("hh:mm:ss");
}



// Kiểm tra xem có phải đúng kết quả cuối hay không, khoảng cách giữa thời điểm hiện tại k dc dài hơn 1 phút so với kết quả trước đó
function isValidLastResult(lastStatistics) {
    var currentHour = new Date().getHours();
    var currentMinute = new Date().getMinutes();
    var createdDate = new Date(lastStatistics.created_time);
    var createdHour = createdDate.getHours();
    var createdMinute = createdDate.getMinutes();

    if (currentHour !== createdHour) {
        return false;
    }
    console.log(currentMinute - createdMinute);
    if (currentMinute - createdMinute > 2) {
        return false;
    }
    return true;
}

async function insertOrder(order, price, isQuickOrder, botId) {
    return await database.insertOrder(order, price, isQuickOrder, botId);
}

async function getOrder(botId) {
    let order = await database.getOrder(botId);
    if (!order) {
        return null;
    }
    let createdTime = new Date(order.created_time).getTime();
    let currrent = new Date().getTime();
    if ((currrent - createdTime) < 65000) { // nếu đúng là lệnh gần nhất
        return order;
    }
    return null;
}


async function updateVolatiltyOfBot(botId, volatility) {
    return await database.updateVolatiltyOfBot(botId, volatility);
}


async function getStatisticByLimit(botId, limit) {
    return await database.getStatisticByLimit(botId, limit);
}

async function getLastOrder(botId) {
    return await database.getLastOrder(botId);
}

// điều kiện để tiếp tục đánh lệnh // limit =3 
async function isReOrder(statistics) {
    if (statistics[2].tradding_data === BUY && statistics[1].tradding_data === BUY) {
        return true;
    }
    if (statistics[2].tradding_data === SELL && statistics[1].tradding_data === SELL) {
        return true;
    }

    if (statistics[2].tradding_data === BUY && statistics[1].tradding_data === SELL && statistics[0].tradding_data === BUY) {
        return true;
    }

    if (statistics[2].tradding_data === SELL && statistics[1].tradding_data === BUY && statistics[0].tradding_data === SELL) {
        return true;
    }
    return false;
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


module.exports = '';