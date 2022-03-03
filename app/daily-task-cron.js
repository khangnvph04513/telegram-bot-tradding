const cron = require('cron');
const database = require('./database-module');
const api = require('./server');
var shell = require('shelljs');
const job = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function() {
        console.log("Migrate data vào đầu ngày");
        clearDataStatistic();
        clearDataOrders();
        clearData();
        initBot();
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
job.start();

const jobRestart = new cron.CronJob({
    cronTime: '0 0 0 * * *',
    onTick: async function() {
        shell.exec('pm2 restart tradding-data', function(code, output) {
            console.log('Exit code:', code);
            console.log('Program output:', output);
          });
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
});
jobRestart.start();

// ========================== VOLUME ========================
async function startTradeVolume() {
    let timeInfo = await getCronTimeInfo();
    const jobTradeVolume = new cron.CronJob({
        cronTime: timeInfo.cronTab,
        onTick: async function () {
            api.sendApiToTradeVolume();
        }
    });
    jobTradeVolume.start();
}
startTradeVolume();


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
    return {cronTab: cronTab, orderSecond: orderSecond.value, resultSecond: resultSecond.value}
}

module.exports = job;