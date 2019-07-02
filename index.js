var chalk = require('chalk')
var clear = require('clear')
var CLI = require('clui')
var figlet = require('figlet')
var inquirer = require('inquirer')
var Spinner = CLI.Spinner
var config = require('config')
// var GitHubApi   = require('rest');
var _ = require('lodash')
var files = require('./lib/files')
var fs = require('fs')

// 設定系
const status = new Spinner('Processing, please wait...')
const Twitter = require('twitter')

// 各キーを設定する
var client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
})
const screen_name = config.screen_name

// screen_nameに自分のIDを設定する
const params = { screen_name: screen_name, cursor: -1, tweet_mode: 'extended' }

// 初期化処理
clear()
console.log(chalk.blue(figlet.textSync('Sumeshitter', { horizontalLayout: 'full' })))

// メイン
const index = async argv => {
  if (config.consumer_key == undefined) {
    const twitterConfig = await init()
    // configファイル書き出し
    try {
      fs.writeFileSync('./config/default.json', JSON.stringify(twitterConfig, undefined, 2))

      console.log('write end')
      console.log('Please Restart Sumeshitter!')
      process.exit()
    } catch (e) {
      console.log(e)
    }
  }

  const command = await question_command()
  await awaitFunction(command)
  // 再起呼び出し
  index()
}

// コマンド受付 hでヘルプ
const init = async callback => {
  return new Promise(resolve => {
    var consumer_key = [
      {
        name: 'Your TwitterId Here (Without "@") ',
        type: 'input',
        message: 'consumer_key',
        validate: function(value) {
          var syan = '\u001b[36m'
          if (!value.length) {
            return 'Please TwitterId (Ex: @aiueo -> aiueo)'
          } else {
            return true
          }
        }
      },
      {
        name: 'consumer_key',
        type: 'input',
        message: 'consumer_key',
        validate: function(value) {
          var syan = '\u001b[36m'
          if (!value.length) {
            return 'Please consumer_key'
          } else {
            return true
          }
        }
      },
      {
        name: 'consumer_secret',
        type: 'input',
        message: 'consumer_secret',
        validate: function(value) {
          var syan = '\u001b[36m'
          if (!value.length) {
            return 'Please consumer_secret'
          } else {
            return true
          }
        }
      },
      {
        name: 'access_token_key',
        type: 'input',
        message: 'access_token_key',
        validate: function(value) {
          var syan = '\u001b[36m'
          if (!value.length) {
            return 'Please access_token_key'
          } else {
            return true
          }
        }
      },
      {
        name: 'access_token_secret',
        type: 'input',
        message: 'access_token_secret',
        validate: function(value) {
          var syan = '\u001b[36m'
          if (!value.length) {
            return 'Please access_token_secret'
          } else {
            return true
          }
        }
      }
    ]

    resolve(inquirer.prompt(consumer_key).then(callback))
  })
}

// コマンド受付 hでヘルプ
const question_command = async callback => {
  var questions = [
    {
      name: 'command',
      type: 'input',
      message: 'Command? Help -> h :',
      validate: function(value) {
        var syan = '\u001b[36m'
        if (!value.length) {
          return 'Please Command....'
        } else if (value == 'h') {
          var str = syan + '\n' + 'p: Post Tweet' + '\n' + 'v: View Tweet' + '\n' + 'f: Favorite Tweet' + '\n' + 'c: Clear Terminal' + '\n' + 'q: Quit Sumeshitter'
          return str
        } else {
          return true
        }
      }
    }
  ]

  return await inquirer.prompt(questions).then(callback)
}

// コマンド解釈 -> 各機能を起動
const awaitFunction = async command => {
  switch (command.command) {
    case 'p':
      const tweet = await tweet_wright()
      if (tweet.text == 'q') {
        break
      }
      console.log('Tweet Text : ' + tweet.text)
      const check = await checkOk()
      if (check.text == 'y') {
        console.log('Tweeting...')
        await post(tweet.text)
      }
      break

    case 'v':
      status.start()
      await tweetView()

      break

    case 'q':
      console.log('Buy~')
      process.exit()
      break

    case 'c':
      clear()
      console.log(chalk.blue(figlet.textSync('Sumeshitter', { horizontalLayout: 'full' })))
      break

    case 'm':
      status.start()
      await mentionView()
      break

    case 'f':
      const id = await tweetId()
      if (id.text == 'q') {
        return
      }
      await favorite(id.text)
      break

    default:
      console.log('"' + command.command + '" ' + 'is Nothing... Retry')
  }
}

// ツイート閲覧　直近の20件+RateLimit
const tweetView = () => {
  return new Promise((resolve, reject) => {
    client.get('statuses/home_timeline', params, function(error, tweets, response) {
      if (!error) {
        var array = []
        var syan = '\u001b[36m'
        tweets.forEach(function(json) {
          var day = new Date(json.created_at)
          day = day.getFullYear() + '/' + day.getMonth() + '/' + day.getDate() + '  ' + day.getHours() + ':' + day.getMinutes() + ':' + day.getSeconds()

          var reset = '\u001b[0m'
          var favorited = json.favorited == true ? '\u001b[33m' : reset
          var favoriteCount = json.retweeted_status == null ? json.favorite_count : json.retweeted_status.favorite_count
          var retweeted = json.retweeted == true ? '\u001b[32m' : reset
          array.push(syan + '⚡ ' + json.user.name + ' (@' + json.user.screen_name + ')' + '  :  ' + '[' + day + ']' + '  :  ' + '[ID ' + json.id_str + ']' + '\n' + reset + json.full_text + '\n' + '\n' + favorited + 'favorite:' + favoriteCount + reset + retweeted + '     retweet:' + json.retweet_count + reset)
        })

        array.reverse()
        status.stop()

        array.forEach(function(full_text) {
          console.log('\n--------------------------------------------------\n' + full_text)
        })

        console.log('\n')

        client.get('application/rate_limit_status.json', params, function(error, results, response) {
          if (!error) {
            console.log('[Rate-limits : ' + results.resources.statuses['/statuses/home_timeline'].remaining + ']' + '\n')

            resolve()
          }
        })
      }
    })
  })
}

// ツイート本文作成　TODO:文字数制限とか入れたい
const tweet_wright = async callback => {
  var tweet = [
    {
      name: 'text',
      type: 'input',
      message: 'Tweet',
      validate: function(value) {
        if (value.length) {
          return true
        } else {
          return 'Quit? -> q'
        }
      }
    }
  ]

  return await inquirer.prompt(tweet).then(callback)
}

// ツイートを実行する
const post = text => {
  return new Promise((resolve, reject) => {
    var honbun = text
    client.post('statuses/update', { status: honbun }, function(error, tweet, response) {
      if (!error) {
        console.log('Done!')
        resolve()
      } else {
        console.log('error... : ' + error)
      }
    })
  })
}

// okかどうかを問い合わせる y/n
const checkOk = async callback => {
  var tweet = [
    {
      name: 'text',
      type: 'input',
      message: 'OK? y/n',
      validate: function(value) {
        if (value.length) {
          return true
        } else {
          return 'Please Command y or n'
        }
      }
    }
  ]

  return await inquirer.prompt(tweet).then(callback)
}

const tweetId = async callback => {
  var id = [
    {
      name: 'text',
      type: 'input',
      message: 'Tweet ID here',
      validate: function(value) {
        if (value.length) {
          return true
        } else {
          return 'Please Tweet ID.  Quit? -> q'
        }
      }
    }
  ]
  return await inquirer.prompt(id).then(callback)
}

const favorite = async id => {
  return new Promise((resolve, reject) => {
    client.post('/favorites/create', { id: id }, function(err, payload) {
      if (!err) {
        console.log('Favorite Done!' + '\n')
        resolve()
      } else {
        console.log(err)
      }
    })
  })
}

if (module.parent) {
  module.exports = index
} else {
  index()
}
