const argv = require('yargs').argv;

module.exports = {
  botToken: argv.token || process.env.token,
  botCommands: {
    BOOKMARKS_ADD: '/bm_add',
    BOOKMARKS_LIST: '/bm_list',
    BOOKMARKS_CLEAR: '/bm_clear',
    BOOKMARKS_DELETE: '/bm_delete'
  },
  bucketConfig: {
    bucketName: process.env.bucket_name,
    bucketKey: process.env.bookmarks_key,
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key
  }
}