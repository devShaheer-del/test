const { Sequelize } = require('sequelize');
require('dotenv').config();

const local_host = process.env.HOST || 'localhost';
const user = process.env.USER || 'root';
const password = process.env.PASSWORD || '';
const database = process.env.DATABASE || 'students';

const sequelize = new Sequelize(database, user, password, {
    host: local_host,
    dialect: 'mysql'
});


try {
     sequelize.authenticate();
    console.log('Database is connected');
} catch (error) {
    console.log('Unable to connect to database', error);
}

module.exports = sequelize;