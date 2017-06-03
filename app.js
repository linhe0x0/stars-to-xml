/**
 * Module dependencies.
 */
const pathToRegexp = require('path-to-regexp')
const Koa = require('koa')
const Feed = require('feed')
const request = require('request')
const app = new Koa()

/**
 * Fetch GitHub stars.
 * @param  {String} url https://api.github.com/users/:username/starred
 * @return {Promise}
 */
const fetch = function fetch(url) {
  const options = {
    url,
    headers: {
      'User-Agent': 'Map GitHub stars to atom.xml'
    }
  }

  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) return reject(err)

      try {
        body = JSON.parse(body)
      } catch(err) {
        return reject(err)
      }

      return resolve(body)
    })
  })
}

/**
 * Convert repo data to atom.xml
 * @pamam  {String} username username
 * @param  {Array} data  repo list
 * @return {String}      atom.xml
 */
const mapReposToAtom = function mapReposToAtom(username, data) {
  let feed = new Feed({
    title: `${username} / starred`,
    description: `${username} starred repos`,
    id: username,
    link: `https://github.com/${username}`,
    updated: new Date(),
    generator: 'Power by GitHub',
    author: {
      name: username,
      link: `https://github.com/${username}`,
    },
  })

  data.forEach((item) => {
    feed.addItem({
      title: item.full_name,
      id: item.id,
      link: item.html_url,
      description: item.description,
      date: new Date(item.updated_at)
    })
  })

  return feed.atom1()
}

/**
 * response middleware
 */
app.use(async ctx => {
  const keys = []
  const regexp = pathToRegexp('/:username/starred/atom.xml', keys)

  const result = regexp.exec(ctx.url)

  if (!result) {
    return ctx.throw(404)
  }

  const username = result[1]

  const repos = await fetch(`https://api.github.com/users/${username}/starred`)

  const atom = mapReposToAtom(username, repos)

  ctx.set('Content-Type', 'application/xml')
  ctx.body = atom
})

/**
 * normalize a port into a number, string, or false.
 */
const normalizePort = function normalizePort(val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Get port from environment and store in Koa.
 */
const port = normalizePort(process.env.PORT || '3000')

app.listen(port)
