const checkRelativeLinks = require('./index.js')

const octokit = require('@octokit/rest')()

// Modified from  https://github.com/urcomputeringpal/yamburger/blob/master/lib/yamburger.js
// Modified from https://github.com/swinton/linter-alex/blob/master/lib/analysis.js

async function processBlob(owner, repo, tree_sha, filename, file_sha) {
  const { data: { content: encoded } } = await octokit.git.getBlob({owner, repo, file_sha})
  const decoded = Buffer.from(encoded, 'base64').toString()
  return {
      path: filename,
      contents: decoded
  }
}

async function analyzeTree(owner, repo, tree_sha) {
  // Get tree, recursively
  const { data: { tree } } = await octokit.git.getTree({owner, repo, tree_sha, recursive: 1})

  // Filter tree, only blobs ending in '.md'
  const blobs = tree.filter(path => {
    const { path: filename, type } = path
    return type === 'blob'  && filename.endsWith('.md')
  });

  // Process each blob
  return Promise.all(blobs.map(blob => {
    const {path: filename, sha: file_sha} = blob
    return processBlob(owner, repo, tree_sha, filename, file_sha)
  }))
}


describe('github', () => {
    let results
    beforeAll(async () => {
        const owner = 'nickcolley'
        const repo = 'probot-link-checker'
        const { data: { sha: tree_sha } } = await octokit.repos.getCommit({ owner, repo, sha: 'HEAD' })
        const filesWithContents = await analyzeTree(owner, repo, tree_sha)
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