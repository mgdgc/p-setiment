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
const { start } = require('repl');
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
    res.render('dict', {

    });
});

module.exports = router;

// 에러 페이지로 이동
function sendError(res, message, redirect) {
    res.redirect('/error?message=' + message + '&redirect=' + redirect);
}