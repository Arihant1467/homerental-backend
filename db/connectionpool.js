const secrets = require('./../constants/key-value.js');
var mysql      = require('mysql');

var connectionPool = mysql.createPool({
  connectionLimit : 10,
  host     : secrets.DB_HOST,
  user     : secrets.DB_USER_NAME,
  password : secrets.DB_PASSWORD,
  database : secrets.DB_NAME,
  port     : secrets.DB_PORT
})

module.exports = {connectionPool} ; 