var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
  }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  const session = JSON.parse(fs.readFileSync('./session.json').toString()) // 读session

  if (path === '/sign_in' && method === 'POST') {
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data', (chunk) => {
      array.push(chunk)
    }) // 请求一个数据，将其添加到数组
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      // 不用buffer，直接返回数组，返回的是字符编码
      const obj = JSON.parse(string) // name password
      const user = userArray.find(
        (user) => user.name === obj.name && user.password === obj.password
      )
      if (user === undefined) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
        response.end(`{"errorCode": 531}`)
      }
      response.statusCode = 200
      const random = Math.random()
      session[random] = { user_id: user.id }
      fs.writeFileSync('./session.json', JSON.stringify(session)) // 存session
      response.setHeader('Set-Cookie', `session_id=${random};HttpOnly`)
      response.end()
    })
  } else if (path === '/home.html') {
    const cookie = request.headers['cookie']
    let sessionId
    try {
      sessionId = cookie
        .split(';')
        .filter((s) => s.indexOf('session_id=') >= 0)[0]
        .split('=')[1]
    } catch (error) {}
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id
      const userArray = JSON.parse(fs.readFileSync('./db/users.json')) // 先找到所有的user
      const user = userArray.find((user) => user.id === userId) // 在所有user里找id等于userId的
      const homeHtml = fs.readFileSync('./public/home.html').toString()
      let string = ''
      if (user) {
        string = homeHtml
          .replace('{{loginStatus}}', '已登录')
          .replace('{{user.name}}', user.name)
      }
      response.write(string)
    } else {
      const homeHtml = fs.readFileSync('./public/home.html').toString()
      const string = homeHtml
        .replace('{{loginStatus}}', '未登录')
        .replace('{{user.name}}', '')
      response.write(string)
    }
    response.end()
  } else if (path === '/register' && method === 'POST') {
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data', (chunk) => {
      array.push(chunk)
    }) // 请求一个数据，将其添加到数组
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      // 不用buffer，直接返回数组，返回的是字符编码
      const obj = JSON.parse(string)
      console.log(obj.name)
      console.log(obj.password)
      const lastUser = userArray[userArray.length - 1]
      const newUser = {
        // id 为最后一个用户的 id+1,如果lastUser不存在id为1
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password,
      } // 要得到userArray里id最大的+1，一般是最后一个
      userArray.push(newUser)
      // 将添加了数据后的数组序列化后返回到 users.json 文件中
      fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
      response.end()
    }) // 请求结束，打印出这个数组
  } else {
    response.statusCode = 200
    // 默认首页
    const filePath = path === '/' ? '/index.html' : path
    const index = filePath.lastIndexOf('.')
    // suffix 是后缀
    const suffix = filePath.substring(index)
    // 哈希表替换
    const fileTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.img': 'image/jpeg',
    }
    response.setHeader(
      'Content-Type',
      `${fileTypes[suffix] || 'text/html'};charset=utf-8`
    )
    let content
    try {
      content = fs.readFileSync(`./public${filePath}`)
    } catch (error) {
      content = '文件不存在'
      response.statusCode = 404
    }
    response.write(content)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log(
  '监听 ' +
    port +
    ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' +
    port
)
