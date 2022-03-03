const cron = require('cron');
const bot = require('./telegram-module');
const database = require('../../database-module');
var moment = require('moment');

// var message = "\u{1F600} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{1F359} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B06} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n \u{2B07} Cho bot gửi thử ký tự đặc biệt và xuống dòng \n"
// message += "\u{1F55D} Đồng hồ, \u{2B06}  Tăng , \u{2B07} Giảm ,\u{1F389} Thắng , \u{274C} Thua , \u{267B} Thống kê, \u{1F4B0} Tiền";
//bot.telegram.sendMessage(-516496456, message);
// Link unicode của icon telegram : https://apps.timwhitlock.info/emoji/tables/unicode

const botId = 17;
const BOT_NAME = "Phương pháp xương cá";
const RUNNING_STATUS = 1;
const STOPPING_STATUS = 0;
const capital = 100;
const WIN = "WIN";
const LOSE = "LOSE";

const NOT_ORDER = "NOT_ORDER";
const NON_QUICK_ORDER = 0;
const QUICK_ORDER = 1;
const QUICK_ORDER_SECOND = 2;
const QUICK_ORDER_THIRD = 3;
const QUICK_ORDER_FOUR = 4;
const BUY = 0;
const SELL = 1;
const STOP_LOSS_VALUE = -5;
//const TELEGRAM_CHANNEL_ID = -1001546623891;
const TELEGRAM_CHANNEL_ID = -677336118;
var isSentMessage = false;
var orderPrice = 1;
initSessionVolatility(botId);
var isFirst = true;
var isQuickOrder = NON_QUICK_ORDER;
const MINUTE_LONGTIMEMILIS = 60 * 1000;
async function startBot() {
    let timeInfo = await getCronTimeInfo();
    const job = new cron.CronJob({
        cronTime: timeInfo.cronTab,
        onTick: async function () {
            let result = await getLastDataTradding();
            let groupIds = await getGroupTelegramByBot(botId);
            console.log("TEST 1");
            if (!result) {
                if (!isSentMessage) {
                    console.log("TEST 2");
                    sendToTelegram(groupIds, `BOT tạm ngưng do không lấy được dữ liệu`);
                    isSentMessage = true;
                }
                return;
            }
            isSentMessage = false;
            var dBbot = await getBotInfo(botId);
            if (dBbot.is_active === 0) {
                console.log("TEST 3");
                console.log("Bot dừng");
                return;
            }
            lastStatistics = await getLastStatistics(botId);
            if (!lastStatistics) {
                console.log("TEST 4");
                console.log("k có data dừng");
                insertToStatistics(botId, NOT_ORDER, 0, 0, 0);
                return;
            }
            // lệnh gấp
            let currentTimeSecond = new Date().getSeconds();
            isFirst = false;
            console.log(`isQuickOrder ${isQuickOrder}`);
            if (currentTimeSecond === parseInt(timeInfo.orderSecond) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 1) || currentTimeSecond === (parseInt(timeInfo.orderSecond) + 2)) { // Vào lệnh
                if (dBbot.is_running === STOPPING_STATUS) {
                    console.log("TEST 5");
                    let currrentTime = new Date().getTime();
                    let isReOrder = await isReOrder2();
                    if (database.checkRowOneForOrder() && isReOrder) {
                        console.log("Đủ điều kiện đánh tiếp");
                        sendToTelegram(groupIds, `SẴN SÀNG VÀO LỆNH`);
                        stopOrStartBot(botId, RUNNING_STATUS);
                    } else {
                        console.log("Chưa đủ điều kiện đánh tiếp");
                        return;
                    }
                    
                }
                if (isQuickOrder === NON_QUICK_ORDER && !database.checkRowOneForOrder()) {
                    console.log("TEST 6");
                    console.log("Lệnh thường -> Chờ kết quả hàng thứ ba -> Không làm gì cả");
                    return;
                }

                var isNotOrder = false;
                console.log(`isQuickOrder ${isQuickOrder}`);
                if (isQuickOrder === NON_QUICK_ORDER || database.checkRowOneForOrder()) {
                    let data = await getOrderForFirstRow();
                    console.log("ORDDER");
                    console.log(data);
                    if (parseInt(data.result) === BUY) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Mua \u{2B06}`);
                        insertOrder(BUY, orderPrice, isQuickOrder, botId);
                    } else if (parseInt(data.result) === SELL) {
                        sendToTelegram(groupIds, `Hãy đánh ${orderPrice}$ lệnh Bán \u{2B07}`);
                        insertOrder(SELL, orderPrice, isQuickOrder, botId);
                    } else {
                        isNotOrder = true;
                    }
                } else if (!database.checkRowOneForOrder() && isQuickOrder !== NON_QUICK_ORDER) {
                    let lastOrder = await getLastOrder(botId);
                    console.log("LAST");
                    console.log(lastOrder);
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
                if (!database.checkRowOneForStatistic() && isQuickOrder === NON_QUICK_ORDER) {
                    insertToStatistics(botId, NOT_ORDER, 0, parseInt(result.result), 0);
                    if (dBbot.is_running === STOPPING_STATUS) {
                        return;
                    }
                    return;
                }

                let order = await getOrder(botId);
                if (!order) {
                    return;
                }
                // THẮNG
                if (parseInt(result.result) === order.orders) {
                    var interest = orderPrice - orderPrice * 0.05;
                    budget = roundNumber(budget + interest, 2);
                    var percentInterest = interest / capital * 100;
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thắng \u{1F389} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : + ${interest}$ (+${percentInterest}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    if (isQuickOrder !== NON_QUICK_ORDER && orderPrice === 4) {
                        insertToStatistics(botId, WIN, QUICK_ORDER, parseInt(result.result), percentInterest);
                    } else {
                        insertToStatistics(botId, WIN, NON_QUICK_ORDER, parseInt(result.result), percentInterest);
                    }

                    orderPrice = 1;
                    isQuickOrder = NON_QUICK_ORDER;

                } else { // THUA
                    var interest = -1 * orderPrice;
                    budget = roundNumber(budget + interest, 2);
                    var percentInterest = interest / capital * 100;
                    sendToTelegram(groupIds, `Kết quả lượt vừa rồi : Thua \u{274C} \n\u{1F4B0}Số dư: ${budget}$ \n\u{1F4B0}Lãi : ${interest}$ (${percentInterest}%)\n\u{1F4B0}Vốn: ${capital}$`);
                    updateBugget(botId, budget);
                    console.log(`isQuickOrder ${isQuickOrder}`);
                    if (isQuickOrder === NON_QUICK_ORDER) {
                        insertToStatistics(botId, LOSE, NON_QUICK_ORDER, parseInt(result.result), percentInterest);
                        isQuickOrder = QUICK_ORDER;
                    } else if (isQuickOrder === QUICK_ORDER) {
                        insertToStatistics(botId, LOSE, QUICK_ORDER, parseInt(result.result), percentInterest);
                        isQuickOrder = QUICK_ORDER_SECOND;
                    } else if (isQuickOrder === QUICK_ORDER_SECOND) {
                        insertToStatistics(botId, LOSE, QUICK_ORDER, parseInt(result.result), percentInterest);
                        isQuickOrder = QUICK_ORDER_THIRD;
                    } else if (isQuickOrder === QUICK_ORDER_THIRD) {
                        insertToStatistics(botId, LOSE, QUICK_ORDER, parseInt(result.result), percentInterest);
                        isQuickOrder = NON_QUICK_ORDER;
                        console.log(`Tạm dừng, chờ kết quả tiếp theo`);
                        sendToTelegram(groupIds, `Tạm dừng, chờ kết quả tiếp theo`);
                        stopOrStartBot(botId, STOPPING_STATUS);
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


async function getLastDataTraddingByLimit(limit) {
    return await database.getLastDataTraddingByLimit(limit);
}

async function getOrderForFirstRow() {
    let data = await getLastDataTraddingByLimit(4);
    if (data.length < 4) {
        return false;
    }
    console.log(data);
    return data[3];
}

async function isReOrder2() {
    let data = await getLastDataTraddingByLimit(8);
    if (data.length < 8) {
        return 0;
    }
    console.log(data[2]);
    console.log(data[4]);
    console.log(data[7]);
    if (data[7].result === data[2].result || data[7].result === data[4].result) {
        return true;
    }
    return false;

}

async function getCronTimeInfo() {
    const ORDER_SETTING_TIME_KEY = "order.setting.second";
    const RESULT_SETTING_TIME_KEY = "result.setting.second";
    let orderSecond = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
    let resultSecond = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
    let cronTab = `${orderSecond.value},${resultSecond.value} * * * * *`;
    return { cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value }
}
async function stopOrStartBot(botId, isRunning) {
    return await database.stopOrStartBot(botId, isRunning);
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
    console.log(result);

    if (currentHour !== createdHour) {
        console.log("Không hợp lệ");
        return false;
    }
    console.log(currentMinute - createdMinute);
    if (currentMinute - createdMinute > 2) {
        console.log("Không hợp lệ");
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

async function initSessionVolatility(botId) {
    return await database.initSessionVolatility(botId);
}

async function getStatisticByLimit(botId, limit) {
    return await database.getStatisticByLimit(botId, limit);
}

async function getLastOrder(botId) {
    return await database.getLastOrder(botId);
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