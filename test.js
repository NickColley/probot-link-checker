const fs = require('fs')
const checkRelativeLinks = require('./index.js')

const glob = require('glob')

glob("fixtures/**/*.md", (error, filePaths) => {
    if (error) {
        throw error
    }

    const files = filePaths.map(path => {
        return { path }
    })

    const filesWithContentsPromises = files.map(file => {
        const { path } = file
        return new Promise((resolve, reject) => {
            fs.readFile(path, (error, contents) => {
                if (error) {
                    reject(error)
                }
                resolve({
                    path,
                    contents
                })
            })
        })
    })

    console.time('nested')
    Promise
        .all(filesWithContentsPromises)
        .then(filesWithContents => {
            checkRelativeLinks(filesWithContents).then(results => {
                console.log(results, results.length)
                console.timeEnd('nested')
            })
        })
})