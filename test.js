const fs = require('fs')

// 读数据库
const usersString = fs.readFileSync('./db/users.json').toString()
const usersArray = JSON.parse(usersString) // 反序列化得到数组

// 写数据库
const user3 = { id: 3, name: 'tom', password: 'yyy', age: 22 }
usersArray.push(user3)
const string = JSON.stringify(usersArray) // 序列化得到字符串
fs.writeFileSync('./db/users.json', string)
