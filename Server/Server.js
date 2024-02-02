// Server.js
// This script will start the server and allow for control of
// all connected users and server tweaking.

// Modules
const express = require('express')
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

var clientConn;

sqlConn.connect(function(err) {
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
            console.log('[SQL] Established Client Connection Successfully.')
        })
    }

    if (err) throw err;
    console.log('[SQL] Established SQL Connection Successfully.')

    sqlConn.query("CREATE DATABASE client", function(err, result) {
        connectClient();

        if (err && err.code == 'ER_DB_CREATE_EXISTS') {return} else if (err && err.code != 'ER_DB_CREATE_EXISTS' ) { throw err }
        console.log('[SQL] Created Database... (client)')
    })
})

// Start Server
console.log('[SERVER] Attempting to Start Server')

const app = express()

app.get('/account/exist/:userName/:userTag', (request, response) => {
    if (!request.params.userName || !request.params.userTag) { response.status(400).end(); return }

    sqlConn.query(`SELECT EXISTS (\nSELECT 1\nFROM information_schema.tables\nWHERE table_schema = 'client'\nAND table_name = '${request.params.userName}${request.params.userTag}');`, function(err, result) {
        if (err) throw err;
        const translatedValue = Object.values(JSON.parse(JSON.stringify(result[0])))

        if (translatedValue==0) { response.send(false) } else { response.send(true) }
    })

})

app.listen(settings.port, () => {
    console.log(`[SERVER] Nimbus Server Started! Port: ${settings.port}`)
})