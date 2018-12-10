const fs = require('fs')
const checkRelativeLinks = require('./index.js')

const glob = require('glob')

glob("fixtures/**/*.md", (error, filePaths) => {
    if (error) {
        throw error
    }

    const filesWithContentsPromises = filePaths.map(path => {        
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
        .then(checkRelativeLinks)
        .then(results => {
            console.log(results, results.length)
            if (results.length !== 7) {
                throw new Error('Unexpected amount of errors')
            }
            console.timeEnd('nested')
        })
        .catch(error => {
            console.error(error)
        })
})