const cron = require('cron');
const database = require('./database-module');
const api = require('./server');
var shell = require('shelljs');
const job = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function () {
        console.log("Migrate data vào đầu ngày");
        clearDataStatistic();
        clearDataOrders();
        clearData();
        initBot();
        initKingAiBot(8);
        initKingAiBot(20);
        initKingAiBot(4);
        initKingAiBot(9);
        initKingAiBot(10);
        initKingAiBot(17);
        initKingAiBot(18);

    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
job.start();

const jobRestart = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function () {
        shell.exec('pm2 restart tradding-data', function (code, output) {
            console.log('Exit code:', code);
            console.log('Program output:', output);
        });

        await sleep(30000);
        shell.exec('pm2 restart app', function (code, output) {
            console.log('Exit code:', code);
            console.log('Program output:', output);
        });
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
jobRestart.start();


async function medthodChecking() {
    let timeInfo = await getTimeStatisticsInfo();
    const botConfigCron = new cron.CronJob({
        cronTime: timeInfo.cronTab,
        onTick: async function () {
            let currentTimeSecond = new Date().getSeconds();
            api.updateBalance();
        }
    });
    botConfigCron.start();
}
medthodChecking();

async function bet4MixMethod() {
    let timeInfo = await getTimeOderInfo();
    const bet4MixMethodCron = new cron.CronJob({
        cronTime: timeInfo.cronTab,
        onTick: async function () {
            api.sendApiBotSetting();
        }
    });
    bet4MixMethodCron.start();
}
bet4MixMethod();


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function clearDataStatistic() {
    return await database.clearDataStatistic();
}

async function clearDataOrders() {
    return await database.clearDataOrders();
}

async function clearData() {
    return await database.clearData();
}

async function initBot() {
    return await database.initBot();
}

async function getCronTimeInfo() {
    const ORDER_SETTING_TIME_KEY = "order.setting.second";
    const RESULT_SETTING_TIME_KEY = "result.setting.second";
    let orderSecond = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
    let resultSecond = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
    let cronTab = `${orderSecond.value} * * * * *`;
    return { cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value }
}

async function getTimeStatisticsInfo() {
    const ORDER_SETTING_TIME_KEY = "order.setting.second";
    const RESULT_SETTING_TIME_KEY = "result.setting.second";
    let orderSecond = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
    let resultSecond = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
    let time4Check = parseInt(resultSecond.value) + 2;
    if (time4Check > 60) {
        time4Check = time4Check - 60;
    }
    let cronTab = `${time4Check} * * * * *`;
    return { cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value }
}

async function checkTraddingData() {
    const traddingDataCheckingCron = new cron.CronJob({
        cronTime: "0 */15 * * * *",
        onTick: async function () {
            let currentTimeSecond = new Date().getSeconds();
            const lastResult = await getLastDataTradding();
            console.log(lastResult);
            if (!lastResult) {
                console.log("RESTART TRADDING-DATA");
                shell.exec('pm2 restart tradding-data', function (code, output) {
                    console.log('Exit code:', code);
                    console.log('Program output:', output);
                });
            }
        }
    });
    traddingDataCheckingCron.start();
}
checkTraddingData();


async function getTimeOderInfo() {
    const ORDER_SETTING_TIME_KEY = "order.setting.second";
    const RESULT_SETTING_TIME_KEY = "result.setting.second";
    let orderSecond = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
    let resultSecond = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
    let time4Check = parseInt(orderSecond.value) + 2;
    console.log(orderSecond.value);
    if (time4Check > 60) {
        time4Check = time4Check - 60;
    }
    let cronTab = `${time4Check} * * * * *`;
    return { cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value }
}

async function getLastDataTradding() {
    let result = await getData();
    let currrent = new Date().getTime();
    if (!result) {
        return null;
    }
    if (((currrent - result.timestamp * 1000) > 60000)) { // kiểm tra trường hợp không lấy dc kết quả -> Tạm dừng
        return null;
    }
    return result;
}

async function getData() {
    return await database.getLastResult();
}

resetCapital4KingAi(8);
resetCapital4KingAi(20);
resetCapital4KingAi(4);
resetCapital4KingAi(9);
resetCapital4KingAi(10);
resetCapital4KingAi(17);
resetCapital4KingAi(18);
resetCapital4KingAi(26);
async function initKingAiBot(botId) {
    if (botId === 20) { // bot 1.5
        return await database.initBotKingAiBot(botId, 31);
    } else if (botId === 8) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 4) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 9) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 10) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 18) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 17) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 26) {
        return await database.initBotKingAiBot(botId, 31);
    }
    else if (botId === 27) {
        return await database.initBotKingAiBot(botId, 31);
    }


}

async function resetCapital4KingAi(botId) {
    if (botId === 20) { // bot 1.5
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 8) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 4) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 9) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 10) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 17) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 18) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 26) {
        return await database.resetCapital4KingAi(botId, 31);
    }
    else if (botId === 27) {
        return await database.resetCapital4KingAi(botId, 31);
    }

}


module.exports = job;