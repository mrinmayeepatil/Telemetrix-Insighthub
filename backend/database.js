const { Sequelize } = require('sequelize');

const seq = new Sequelize("influxdb", "root", "12345", {
    host: '127.0.0.1',
    port: 3306,
    dialect: "mysql",
});

module.exports = { seq };
