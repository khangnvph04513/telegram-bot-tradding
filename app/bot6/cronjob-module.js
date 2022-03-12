const cron = require('cron');
const bot = require('./telegram-module');
//const bot = require('../telegram-test2'); // k push
const database = require('../database-module');
var moment = require('moment');

// var message = "\u{1F600} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{1F359} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B06} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B07} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n"
// message += "\u{1F55D} Đồng hồ, \u{2B06}  Tăng , \u{2B07} Giảm ,\u{1F389} Thắng , \u{274C} Thua , \u{267B} Thống kê, \u{1F4B0} Tiền";
//bot.telegram.sendMessage(-516496456, message);
// Link unicode của icon telegram : https://apps.timwhitlock.info/emoji/tables/unicode



const botId = 9;
const BOT_NAME = "Phương pháp 6(1 mặt xanh)";
const capital = 100;
const WIN = "WIN";
const isQuickOrder = 0;
const LOSE = "LOSE";
const NOT_ORDER = "NOT_ORDER";
const STATISTIC_TIME_AFTER = 10;
const NON_QUICK_ORDER = 0;
const QUICK_ORDER = 1;
const BUY = 0;
const SELL = 1;
const TELEGRAM_CHANNEL_ID = -1001717909764;
var orderPrice = 1;
var isStop = false;
var stopTime = new Date().getTime();
var isLose = false;
var isLoseSecondTime = false;
var isSentMessage = false;
const MINUTE_LONGTIMEMILIS = 60 * 1000;
var tempOrder = null;
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
            if (currentTimeSecond === parseInt(timeInfo.orderSecond) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 2)) { // Vào lệnh

                var isNotOrder = false;
                let lastStatistic = await getLastStatistics(botId);
                const currrent = new Date().getTime();
                const lastTime = new Date(lastStatistic.created_time).getTime();
                if ((currrent - lastTime) > 35000) { // kiểm tra trường hợp không lấy dc kết quả -> Tạm dừng
                    return;
                }
                if (isStop) {
                    tempOrder = BUY;
                    return;
                }
                sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Mua \u{2B06}`);
                insertOrder(BUY, orderPrice, isQuickOrder, botId);
                if (!isNotOrder) {
                    sendToTelegram(groupIds, `Chờ kết quả \u{1F55D} !`);
                }
            }
            if (currentTimeSecond === parseInt(timeInfo.resultSecond) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.resultSecond) + 2)) { // Update kết quả, Thống kê
                var budget = dBbot.budget;
                let order = await getOrder(botId);
                if (!order) {
                    insertOrder(0, 0, 0, botId);
                    return;
                }
                if (isStop) {
                    insertToStatistics(botId, NOT_ORDER, 0, parseInt(result.result), 0);
                    let currrentTime = new Date().getTime();
                    if ((currrentTime - stopTime) >= 1 * MINUTE_LONGTIMEMILIS) {
                        //let statistics = await getStatisticByLimit(botId, 3);
                        if (tempOrder === parseInt(result.result)) {
                            sendToTelegram(groupIds, `SẴN SÀNG VÀO LỆNH!`);
                            isStop = false;
                            initSessionVolatility(botId);
                            isLose = false;
                            isLoseSecondTime = false;
                        } else {
                            stopTime = new Date().getTime();
                        }
                    } else {
                    }
                    return;
                }
                // THẮNG
                if (parseInt(result.result) === order.orders) {
                    var interest = orderPrice - orderPrice * 0.05;
                    budget = roundNumber(budget + interest, 2);
                    var percentInterest = interest / capital * 100;
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thắng \u{1F389} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : + ${interest}$ (+${percentInterest}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    insertToStatistics(botId, WIN, NON_QUICK_ORDER, parseInt(result.result), percentInterest);
                    updateVolatiltyOfBot(botId, 0);
                    isLose = false;
                    isLoseSecondTime = false;
                } else { // THUA
                    var interest = -1 * orderPrice;
                    budget = roundNumber(budget + interest, 2);
                    var percentInterest = interest / capital * 100;
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thua \u{274C} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : ${interest}$ (${percentInterest}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    insertToStatistics(botId, LOSE, NON_QUICK_ORDER, parseInt(result.result), percentInterest);
                    let volatility = dBbot.session_volatility + interest;
                    updateVolatiltyOfBot(botId, volatility);
                    if (isLose && isLoseSecondTime) {
                        isStop = true;
                        await sleep(2000);
                        sendToTelegram(groupIds, `Tạm dừng, chờ kết quả tiếp theo`);
                        stopTime = new Date().getTime();
                    }
                    if (isLose) {
                        isLoseSecondTime = true;
                    }
                    isLose = true;

                }

                // Thống kê sau n lệnh
                await sleep(5000);
                let statisc = await statisticDay(botId, STATISTIC_TIME_AFTER);
                if (statisc) {
                    let sessionNumber = parseInt(statisc.length / STATISTIC_TIME_AFTER);
                    let statisticsMsg = [];
                    statisticsMsg.push(`\u{267B} Tổng kết ${STATISTIC_TIME_AFTER} lệnh:\n`);
                    let statisticalsTimeAfterStr = [];
                    let index = 1;
                    let winOrder = 0;
                    let lostOrder = 0;
                    let quickWinOrder = 0;
                    let quickLostOrder = 0;
                    let winOrderDay = 0;
                    let lostOrderDay = 0;
                    let quickWinOrderDay = 0;
                    let quickLostOrderDay = 0;
                    statisc.forEach(e => {
                        if (e.result === WIN) {
                            if (index <= STATISTIC_TIME_AFTER && e.is_statistics === 0) {
                                statisticalsTimeAfterStr.push(`${index}. \u{1F389} (${formatDateFromISO(e.created_time)}) Thắng +${e.interest} % \n`);
                                if (e.is_quick_order === NON_QUICK_ORDER) {
                                    winOrder++;
                                } else {
                                    quickWinOrder++;
                                }
                                index++;
                            }
                            if (e.is_quick_order === NON_QUICK_ORDER) {
                                winOrderDay++;
                            } else {
                                winOrderDay++;
                                quickWinOrderDay++;
                            }
                        } else {
                            if (index <= STATISTIC_TIME_AFTER && e.is_statistics === 0) {
                                statisticalsTimeAfterStr.push(`${index}. \u{274C} (${formatDateFromISO(e.created_time)}) Thua ${e.interest} % \n`);
                                if (e.is_quick_order === NON_QUICK_ORDER) {
                                    lostOrder++;
                                } else {
                                    quickLostOrder++;
                                }
                                index++;
                            }
                            if (e.is_quick_order === NON_QUICK_ORDER) {
                                lostOrderDay++;
                            } else {
                                quickLostOrderDay++;
                            }
                        }
                    });
                    let winLoseRatio = (winOrder + quickWinOrder * 2) * 0.95 - (lostOrder + quickLostOrder * 2);

                    statisticsMsg.push(`\u{267B} Phiên thứ ${sessionNumber} (+1) \n`);
                    statisticsMsg.push(`Kết quả : ${winLoseRatio}% \n`);
                    statisticsMsg = statisticsMsg.concat(statisticalsTimeAfterStr);
                    statisticsMsg.push(`------------------------------------------------\n`);
                    statisticsMsg.push(`Tổng số lệnh THẮNG (từ 00:00) là: ${winOrderDay}\n`);
                    statisticsMsg.push(`Tổng số lệnh thắng gấp (từ 00: 00) là : ${quickWinOrderDay} \n`);
                    statisticsMsg.push(`Tổng số lệnh thua gấp (từ 00: 00) là ${quickLostOrderDay}`);
                    sendToTelegram(groupIds, statisticsMsg.join(' '));
                    updateStatusForStatistics(botId);
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

async function insertToStatistics(botid, result, isQuickOrder, traddingData, interest) {
    return await database.insertToStatistics(botid, result, isQuickOrder, traddingData, interest);
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



async function statisticDay(botid, timeAfter) {
    return await database.statisticDay(botid, timeAfter);
}

function formatDateFromISO(date) {
    return moment(date.toString()).format("hh:mm:ss");
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

async function initSessionVolatility(botId) {
    return await database.initSessionVolatility(botId);
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

module.exports = '';