
const puppeteer = require('puppeteer-extra');
const database = require('./app/database-module');
const cron = require('cron');
var shell = require('shelljs');
const readFileSync = require('fs');

//let capchaApi = JSON.parse(readFileSync.readFileSync('E:/Project/telegram-bot-tradding/capcha-api.json', 'utf-8'));
let capchaApi = JSON.parse(readFileSync.readFileSync('/home/capcha-api.json', 'utf-8'));

const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const { connect, ConsoleMessage } = require('puppeteer');
puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: capchaApi.apiKey // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
        },
        visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
)
var lastResult = null; // 0: Xanh 1: Đỏ
var leftTime = null;
// puppeteer usage as normal
const BUFFER_TIMING = 2;
const ORDER_DELAY_TIMING = 10;
const ORDER_SETTING_TIME_KEY = "order.setting.second";
const RESULT_SETTING_TIME_KEY = "result.setting.second";

var isBetSession = true;
puppeteer.launch({ headless: true, args: ['--no-sandbox'] }).then(async browser => {
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://bitiva1.net/login')
    await page.type('input[name="email"]', 'gunh39683@gmail.com', { delay: 100 })
    await page.type('input[name="password"]', '123456', { delay: 100 })
    // await page.type('input[name="email"]', 'khangnvph045132@gmail.com', { delay: 100 })
    // await page.type('input[name="password"]', '123@123Aa', { delay: 100 })
    await page.click('#main-content > div > div > div > div.boxAuthentication.show > div > div.formWapper.w-100 > form > div.form-group.text-center > button')

    // That's it, a single line of code to solve reCAPTCHAs 🎉


    await page.solveRecaptchas()
    await Promise.all([
        page.waitForNavigation(),
    ]);
    const job = new cron.CronJob({
        cronTime: '45 0/2 * * * *',
        onTick: async function () {
            await page.reload({ waitUntil: ["networkidle0"] });
        }
    });
    job.start()
    let cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Page.enable');
    let result = `Kết quả bóng vừa rồi : Đỏ \u{2B06}`;
    let id = 1;
    count = 0;
    let countStaticData = 0;
    let communitiesId = 1;
    const printResponse = async function (cdp, response) {
        if (!response.response) {
            return;
        }
        let data = response.response.payloadData;
        if (data.includes("BO_PRICE")) {
            isBetSession = JSON.parse(data.substr(2, data.length))[1].isBetSession;
        }
        if (data.includes("SOCKET_BO_LAST_RESULT") && data.includes("finalSide")) {
            console.log(response.requestId)
            let str = response.response.payloadData;
            if (id !== JSON.parse(str.substr(2, str.length))[1][0].id) {
                count = 0;
                id = JSON.parse(str.substr(2, str.length))[1][0].id;
            } else {
                count++;
            }
            if (count == 4) {
                let finalSide = JSON.parse(str.substr(2, str.length))[1][0].finalSide
                if (finalSide === "UP") {
                    lastResult = 0;
                    result = `Kết quả bóng vừa rồi : Xanh \u{1F34F}`
                } else if (finalSide === "DOWN") {
                    result = `Kết quả bóng vừa rồi : Đỏ \u{1F34E}`
                    lastResult = 1;
                } else {
                    result = `Kết quả bóng vừa rồi : Hòa`
                    lastResult = 2;
                    console.log(`CHECK ressult ${finalSide}`);
                }
                await database.inserRessult(lastResult);
                if (isBetSession) {
                    let isRestart = false;
                    let currentTimeSecond = new Date().getSeconds();
                    let newResultTiming = currentTimeSecond + BUFFER_TIMING;
                    let oldResultTiming = await database.getSettingByKey(RESULT_SETTING_TIME_KEY);
                    console.log(`currentTimeSecond ${currentTimeSecond}`);
                    console.log(`newResultTiming ${newResultTiming}`);
                    if (newResultTiming > 60) {
                        newResultTiming = newResultTiming - 60;
                    }
                    if (Math.abs(parseInt(oldResultTiming.value) - newResultTiming) > 5) {
                        await database.stopAll();
                        await database.stopAllGroup();
                        await database.updateSetting(RESULT_SETTING_TIME_KEY, newResultTiming);
                        console.log("pm2 restart app");
                        await sleep(1000);
                        isRestart = true;
                    }
                    //let currentTimeSecond = new Date().getSeconds();
                    let newOrderTiming = currentTimeSecond + ORDER_DELAY_TIMING;
                    let oldOrderTiming = await database.getSettingByKey(ORDER_SETTING_TIME_KEY);
                    console.log(`currentTimeSecond ${currentTimeSecond}`);
                    console.log(`newOrderTiming ${newOrderTiming}`);
                    if (newOrderTiming > 60) {
                        newOrderTiming = newOrderTiming - 60;
                    }
                    if (Math.abs(parseInt(oldOrderTiming.value) - newOrderTiming) > 5) {
                        await database.stopAll();
                        await database.stopAllGroup();
                        await database.updateSetting(ORDER_SETTING_TIME_KEY, newOrderTiming);
                        await sleep(1000);
                        isRestart = true;
                    }
                    if (isRestart) {
                        shell.exec('pm2 stop app', function (code, output) {
                            console.log('Exit code:', code);
                            console.log('Program output:', output);
                        });
                        await sleep(60000);
                        shell.exec('pm2 start app', function (code, output) {
                            console.log('Exit code:', code);
                            console.log('Program output:', output);
                        });
                        isRestart = false;
                    }
                }

            }
        }
        if (data === "3") {
            console.log(data);
            countStaticData++;
        } else {
            countStaticData = 0;
        }
        if (countStaticData === 2) {
            console.log("Vao truong hop 4")
            cdp.detach();
            cdp = await page.target().createCDPSession();
            await cdp.send('Network.enable');
            await cdp.send('Page.enable');
            cdp.on('Network.webSocketFrameReceived', printResponse.bind(this, cdp));

        }
    }
    cdp.on('Network.webSocketFrameReceived', printResponse.bind(this, cdp)); // Fired when WebSocket message is received.
    // cdp.on('Network.webSocketFrameSent', printResponse); // Fired when WebSocket message is sent.
    cdp.on('Network.webSocketCreated', async (response) => {
        console.log("Vào webSocketCreated")
        console.log(response);
    })
})

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

exports.leftTime = leftTime;
module.exports = puppeteer;
