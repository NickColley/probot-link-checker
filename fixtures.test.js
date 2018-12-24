const fs = require('fs')
const checkRelativeLinks = require('./index.js')

const globby = require('globby')

describe('fixtures', () => {
    let results
    beforeAll(async () => {
        const filePaths = await globby("fixtures/**/*.md")
        
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
    
        const filesWithContents = await Promise.all(filesWithContentsPromises)
        results = await checkRelativeLinks(filesWithContents)
    })
    it('should have a link property on the results', async () => {
        expect(results.every(result => result.position)).toBeTruthy()
    })
    it('should have a position property on the results', async () => {
        expect(results.every(result => result.link)).toBeTruthy()
    })
    it('should have a certain amount of errors', async () => {
        expect(results.length).toBe(8)
    })
})