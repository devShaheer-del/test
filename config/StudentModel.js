const { DataTypes, Sequelize } = require('sequelize');

const db = require('./Database');

const StudentsModel = db.define('class_table', {
    name: { type: DataTypes.STRING(20), allowNull: false },
    last_name: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(100), allowNull: false },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Others'), defaultValue: 'Male' },
    phone: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false }
},
    {
        timestamps: true
    }

);


module.exports = StudentsModel;