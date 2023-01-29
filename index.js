// Express
const express = require('express');
const router = express.Router();

// IP Request
const requestIp = require('request-ip');

// Crypto
const crypto = require('crypto');

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Mariadb
const mysql = require('mysql2/promise');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const dbPool = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'panza_setiment',
    multipleStatements: true
});

router.get('/', async function (req, res) {
    const connection = await dbPool.getConnection();

    const date = new Date();
    const startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
    const endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-31';
    const [uploads] = await connection.query('select * from upload where date between ? and ? order by `date` desc;', [startDate, endDate]);
    const [promiseDone] = await connection.query('select count(*) as count from promise where `status` = 2;');
    const [promiseHalf] = await connection.query('select count(*) as count from promise where `status` = 1;');
    const [promiseFail] = await connection.query('select count(*) as count from promise where `status` = 0;');
    const [promiseTop] = await connection.query('select * from promise order by _id desc limit 5;');
    const [likes] = await connection.query('select count(*) as count from `like` where date between ? and ?;', [startDate, endDate]);
    const [sads] = await connection.query('select count(*) as count from sad where date between ? and ?;', [startDate, endDate]);
    const [calibrate] = await connection.query('select * from calibrate order by _id desc limit 1;');

    var uploadScore = uploads.length;
    if (uploadScore > 0 && uploadScore <= 4) {
        uploadScore = uploadScore / 4.0 * 100;
    } else if (uploadScore > 4) {
        uploadScore = 100;
    }

    var promiseScore = promiseDone[0].count * 2 + promiseHalf[0].count;
    if (promiseScore > 0) {
        promiseScore / (promiseDone[0].count + promiseHalf[0].count + promiseFail[0].count) * 2 * 100;
    }

    var likeScore = likes[0].count;
    if (likeScore > 0) {
        likeScore = likeScore / (likes[0].count + sads[0].count) * 100;
    }

    var totalScore = (uploadScore / 3) + (promiseScore / 3) + (likeScore / 3) + calibrate[0].score;

    connection.release();

    res.render('index', { calibrate: calibrate[0].score, totalScore: totalScore, uploadScore: uploadScore, uploads: uploads, promiseScore: promiseScore, promiseDone: promiseDone, promiseHalf, promiseHalf, promiseFail: promiseFail, promiseTop: promiseTop, likeScore: likeScore, likes: likes, sads: sads });
});

router.get('/like', async function (req, res) {
    const ip = requestIp.getClientIp(req);
    const digested = crypto.createHash('sha256').update(ip).digest('hex');

    const connection = await dbPool.getConnection();
    const sqlLikeCount = 'select count(*) as count from `like` where ipaddr = ? and `date` = curdate();';
    const [likeCount] = await connection.query(sqlLikeCount, [ip]);

    if (likeCount[0].count < 5) {
        const sqlLike = 'insert into `like` (ipaddr) values (?);';
        await connection.query(sqlLike, [digested]);
        res.redirect('/');
    } else {
        sendError(res, "하루에 5번만 할 수 있어요.", "/");
    }
});

router.get('/sad', async function (req, res) {
    const ip = requestIp.getClientIp(req);
    const digested = crypto.createHash('sha256').update(ip).digest('base64');

    const connection = await dbPool.getConnection();
    const sqlLikeCount = 'select count(*) as count from sad where ipaddr = ? and `date` = curdate();';
    const [likeCount] = await connection.query(sqlLikeCount, [digested]);

    if (likeCount[0].count < 5) {
        const sqlLike = 'insert into sad (ipaddr) values (?);';
        await connection.query(sqlLike, [ip]);
        res.redirect('/');
    } else {
        sendError(res, "하루에 5번만 할 수 있어요.", "/");
    }
});



module.exports = router;

// 에러 페이지로 이동
function sendError(res, message, redirect) {
    res.redirect('/error?message=' + message + '&redirect=' + redirect);
}