const path = require('path')
const fs = require('fs')
const pug = require('pug')
const glob = require('glob')
const mkdirp = require('mkdirp')
const replaceExt = require('replace-ext')

const buildDir = path.resolve(__dirname, 'build')

glob('**/[^_]*', { cwd: path.resolve(__dirname, 'src') }, (_, files) => {
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
      const data = fs.readFileSync(src, 'utf-8')
      fs.writeFileSync(target, data)
    }
  })
})

// TODO: Read data
