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

// Handle every file in src except templates
glob('**/[^_]*', {
  cwd: path.resolve(__dirname, 'src'),
  nodir: true,
  ignore: 'templates/**/*.pug'
}, (_, files) => {
  files.forEach(file => {
    const ext = path.extname(file)
    const src = path.resolve(__dirname, 'src', file)
    const target = path.resolve(buildDir, file)

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

// Handle data rendering
glob('**/*', { cwd: '_data', nodir: true }, (_, files) => {
  files.forEach(file => {
    const src = path.resolve(__dirname, '_data', file)
    const targetFile = path.basename(file)
    const layout = path.dirname(file)
    const data = JSON.parse(fs.readFileSync(src))

    if (data.body) {
      data.body = md.render(data.body)
    }

    const current = path.basename(targetFile, '.json')
    data.resize = (img, size) => {
      return img
    }
    data.menu = [
      { href: '/', label: 'Hem', active: current === 'hem' },
      { href: '/lediga-tider', label: 'Är den ledig / priser?', active: current === 'lediga-tider' },
      { href: '/lagenheten', label: 'Lägenheten', active: current === 'lagenheten' },
      { href: '/bilder', label: 'Bilder', active: current === 'bilder' },
      { href: '/hur-bokar-jag', label: 'Hur bokar jag?', active: current === 'hur-bokar-jag' },
    ]

    const template = path.resolve(__dirname, 'src/templates', `${layout}.pug`)
    const rendered = pug.renderFile(template, data)
    const target = path.resolve(buildDir, targetFile.replace('hem.json', 'index.json'))

    mkdirp.sync(path.dirname(target))

    fs.writeFileSync(replaceExt(target, '.html'), rendered)
  })
})
