const path = require('path')
const fs = require('fs')
const pug = require('pug')
const glob = require('glob')
const mkdirp = require('mkdirp')
const replaceExt = require('replace-ext')

const md = require('markdown-it')({
  linkify: true,
  typographer: true,
  breaks: true
})

md
  .use(require('markdown-it-toc'))
  .use(require('markdown-it-footnote'))
  .use(require('markdown-it-sub'))
  .use(require('markdown-it-sup'))
  .use(require('markdown-it-mark'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-ins'))
  .use(require('markdown-it-abbr'))
  .use(require('markdown-it-checkbox'))

md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  var token = tokens[idx]
  token.attrPush([ 'class', 'table table-striped table-bordered' ])

  return self.renderToken(tokens, idx, options)
}

const buildDir = path.resolve(__dirname, 'build')

glob('**/[^_]*', {
  cwd: path.resolve(__dirname, 'src'),
  ignore: 'templates/**/*.pug'
}, (_, files) => {
  files.forEach(file => {
    const ext = path.extname(file)
    const src = path.resolve(__dirname, 'src', file)
    const target = path.resolve(buildDir, file)

    if (!fs.lstatSync(src).isFile()) return

    mkdirp.sync(path.dirname(target))

    if (ext === '.pug') {
      const rendered = pug.renderFile(src)
      fs.writeFileSync(replaceExt(target, '.html'), rendered)
    } else {
      const data = fs.readFileSync(src)
      fs.writeFileSync(target, data)
    }
  })
})

glob('**/*', { cwd: '_data' }, (_, files) => {
  files.forEach(file => {
    const src = path.resolve(__dirname, '_data', file)
    const data = JSON.parse(fs.readFileSync(src))

    if (!data.layout) return

    if (data.body) {
      data.body = md.render(data.body)
    }

    const template = path.resolve(__dirname, 'src/templates', `${data.layout}.pug`)
    const rendered = pug.renderFile(template, data)
    const target = path.resolve(buildDir, file.replace('hem.json', 'index.json'))

    mkdirp.sync(path.dirname(target))

    fs.writeFileSync(replaceExt(target, '.html'), rendered)
  })
})
