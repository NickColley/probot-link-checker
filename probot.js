const getConfig = require('probot-config');
const minimatch = require("minimatch")
const checkRelativeLinks = require('./index.js')

// Modified from  https://github.com/urcomputeringpal/yamburger/blob/master/lib/yamburger.js
// Modified from https://github.com/swinton/linter-alex/blob/master/lib/analysis.js

async function processBlob(context, owner, repo, tree_sha, filename, file_sha) {
  const { data: { content: encoded } } = await context.github.gitdata.getBlob({owner, repo, file_sha})
  const decoded = Buffer.from(encoded, 'base64').toString()
  return {
      path: filename,
      contents: decoded
  }
}

async function analyzeTree(context, owner, repo, tree_sha, ignoredFiles) {
  // Get tree, recursively
  const { data: { tree } } = await context.github.gitdata.getTree({owner, repo, tree_sha, recursive: 1})

  const blobs = tree
   // Filter tree, only blobs ending in '.md'
  .filter(path => {
    const { path: filename, type } = path
    return type === 'blob'  && filename.endsWith('.md')
  })
  // Filter out any ignored files
  .filter(path => {
    const { path: filename, type } = path
    if (ignoredFiles) {
      return ignoredFiles.some(file => {
        return minimatch(file, filename)
      })
    }
    return true
  })

  // Process each blob
  return Promise.all(blobs.map(blob => {
    const {path: filename, sha: file_sha} = blob
    return processBlob(context, owner, repo, tree_sha, filename, file_sha)
  }))
}

module.exports = (app) => {
  // Your code here
  app.log('Yay! The app was loaded!')
  
  app.on(['check_suite.requested', 'check_suite.rerequested', 'check_run.rerequested'], check)

  async function check (context) {
    const { ignoredFiles } = await getConfig(context, 'link-checker.yml');

    const { owner, repo } = context.repo()
    
    let head_branch
    let head_sha
    
    if (context.payload.check_suite) {
      head_branch = context.payload.check_suite.head_branch
      head_sha = context.payload.check_suite.head_sha
    } else {
      head_branch = context.payload.check_run.head_branch
      head_sha = context.payload.check_run.head_sha
    }
    
    app.log('Start check')
    await context.github.checks.create(context.repo({
      name: 'Probot Link Checker',
      head_branch,
      head_sha,
      status: 'in_progress'
    }))
    
    
    const { data: { sha: tree_sha } } = await context.github.repos.getCommit({ owner, repo, sha: head_sha })
    const filesWithContents = await analyzeTree(context, owner, repo, tree_sha, ignoredFiles)
    const results = await checkRelativeLinks(filesWithContents)
    
    if (results.length > 0) {
      try {
        const annotations = (
          results.map(result => {
            const start_line = result.position.start.line
            const end_line = result.position.end.line
            let annotations = {
              annotation_level: 'failure',
              path: result.path,
              message: `${result.message}`,
              start_line,
              end_line
            }
            
            // Only set columns if on the same line or it will explode.
            if (start_line === end_line) {
              const start_column = result.position.start.column
              const end_column = result.position.end.column
              annotations['start_column'] = start_column
              annotations['end_column'] = end_column
            }
    
            return annotations
          })
        )
        await context.github.checks.create(context.repo({
          name: 'Probot Link Checker',
          head_branch,
          head_sha,
          status: 'completed',
          conclusion: 'failure',
          completed_at: new Date(),
          output: {
            title: 'Probot check!',
            summary: 'The check has failed!', // + JSON.stringify(results, null, 2),
            annotations
          }
        }))
      } catch (error) {
        console.error(error)
        await context.github.checks.create(context.repo({
          name: 'Probot Link Checker',
          head_branch,
          head_sha,
          status: 'completed',
          conclusion: 'failure',
          completed_at: new Date(),
          output: {
            title: 'Probot check!',
            summary: 'The check has failed! ' + error
          }
        }))
      }
      app.log('End check (failure)')
    } else {
      await context.github.checks.create(context.repo({
        name: 'My app!',
        head_branch,
        head_sha,
        status: 'completed',
        conclusion: 'success',
        completed_at: new Date(),
        output: {
          title: 'Probot check!',
          summary: 'The check has passed! ' + JSON.stringify(results, null, 2)
        }
      }))
      app.log('End check (success)')
    }
  }

  // example of probot responding 'Hello World' to a new issue being opened
  app.on('issues.opened', async context => {
//     const { owner, repo } = context.repo()
//     const { data: { sha: tree_sha } } = await context.github.repos.getCommit({ owner, repo, sha: 'HEAD' })
//     const filesWithContents = await analyzeTree(context, owner, repo, tree_sha)
//     const results = await checkRelativeLinks(filesWithContents)
//     console.log(results)

//     // `context` extracts information from the event, which can be passed to
//     // GitHub API calls. This will return:
//     //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
//     const params = context.issue({body: 'Hello World!'})
    

//     // Post a comment on the issue
//     return context.github.issues.createComment(params)
  })
}
