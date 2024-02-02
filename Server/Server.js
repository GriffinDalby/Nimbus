// Server.js
// This script will start the server and allow for control of
// all connected users and server tweaking.

// Modules
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const fs = require('fs')

const settings = require('./Settings.json')

// Constants
// Variables
// Functions
// Contact SQL
console.log('[SQL] Attempting to establish connection to SQL Database...')
var sqlConn = mysql.createConnection({
    host: settings.sql.accounts.host,
    user: settings.sql.accounts.user,
    password: settings.sql.accounts.password,
})
var clientConn

sqlConn.connect(function(err) {
    if (err) throw err;
    console.log('[SQL] Established SQL Connection Successfully.')

    function connectClient() {
        console.log('[SQL] Attempting to establish connection to Client Database...')

        clientConn = mysql.createConnection({
            host: settings.sql.accounts.host,
            user: settings.sql.accounts.user,
            password: settings.sql.accounts.password,
            database: "client"
        })

        clientConn.connect(function(err){
            if(err) throw err;
            console.log('[SQL.Client] Established Client Connection Successfully.')

            const accountsTable = 'CREATE TABLE IF NOT EXISTS accounts (username VARCHAR(32) NOT NULL,usertag VARCHAR(4) NOT NULL,password VARCHAR(255) NOT NULL, CONSTRAINT pkey PRIMARY KEY (username, usertag));'
            clientConn.query(accountsTable, function(err, result) {
                if (err) throw err
                console.log('[SQL.Client] Handled accounts Table...')
            })
        })
    }

    sqlConn.query("CREATE DATABASE IF NOT EXISTS client", function(err, result) {
        if (err && err.code == 'ER_DB_CREATE_EXISTS') {return} else if (err && err.code != 'ER_DB_CREATE_EXISTS' ) { throw err }
        console.log('[SQL] Handled Client Database...')
        connectClient()
    })
})

// Shorthand SQL Functions
function A(Database, tableName, recordName, recordValue){
    
}

// Start Server
console.log('[SERVER] Attempting to Start Server')

const app = express()
app.use(bodyParser.json())

// Endpoint: /account/exist
// Returns: boolean
// Body: { "userName": "", "userTag": "" }
// Checks if Account Exists in Database.
app.get('/account/exist', (request, response) => {
    const userName = request.body.userName
    const userTag = request.body.userTag
    if (!userName || !userTag) { response.status(400).end(); return }

    clientConn.query(`SELECT * FROM accounts WHERE EXISTS (SELECT username FROM accounts WHERE accounts.username = "${userName}" AND accounts.usertag = "${userTag}");`, function(err, result) {
        if (err) throw err;
        const translatedValue = JSON.parse(JSON.stringify(result))[0]
        if (translatedValue == undefined) {
            response.send(false)
        } else { response.send(true) }
    })

})

// Endpoint: /account/register
// Returns: boolean/code
// Body: { "userName": "", "userTag": "", "password": "" }
// Registers a New Account.
app.post('/account/register', (request, response) => {
    const userName = request.body.userName
    const userTag = request.body.userTag
    const password = request.body.password
    if (!userName || !userTag || !password) { response.status(400).end(); return }

    // Check if we have account with these already
    clientConn.query(`SELECT * FROM accounts WHERE EXISTS (SELECT username FROM accounts WHERE accounts.username = "${userName}" AND accounts.usertag = "${userTag}");`, function(err, result) {
        if (err) throw err;
        const translatedValue = JSON.parse(JSON.stringify(result))[0] // Translate RDP
        if (translatedValue == undefined) {

            // Doesn't exist, create
            const hashedPassword = password // TODO: Hash
            clientConn.query(`INSERT INTO accounts VALUES ('${userName}', '${userTag}', '${hashedPassword}')`, function(err, result) { 
                if (err) throw err;
                response.send(true)
            })

        } else {

            // Does exist, deny
            response.status(409).send() // Conflict

        }
    })

    

})

app.listen(settings.port, () => {
    console.log(`[SERVER] Nimbus Server Started! Port: ${settings.port}`)
})