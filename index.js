var chalk = require("chalk")
var clear = require("clear")
var CLI = require("clui")
var figlet = require("figlet")
var inquirer = require("inquirer")
var Preferences = require("preferences")
var Spinner = CLI.Spinner
// var GitHubApi   = require('rest');
var _ = require("lodash")
var files = require("./lib/files")

// 設定系
const status = new Spinner("Processing, please wait...")
const Twitter = require("twitter")

// 各キーを設定する
const client = new Twitter({
  consumer_key: "",
  consumer_secret: "",
  access_token_key: "",
  access_token_secret: ""
})
// screen_nameに自分のIDを設定する
const params = { screen_name: "", cursor: -1, tweet_mode: "extended" }

// 初期化処理
clear()
console.log(chalk.blue(figlet.textSync("Sumeshitter", { horizontalLayout: "full" })))

// メイン
const index = async argv => {
  const command = await question_command()
  await awaitFunction(command)
  // 再起呼び出し
  index()
}

// コマンド受付 hでヘルプ
const question_command = async callback => {
  var questions = [
    {
      name: "command",
      type: "input",
      message: "Command? Help -> h :",
      validate: function(value) {
        var syan = "\u001b[36m"
        if (!value.length) {
          return "Please Command...."
        } else if (value == "h") {
          var str = syan + "\n" + "p: Post Tweet" + "\n" + "v: View Tweet" + "\n" + "c: Clear Terminal" + "\n" + "q: Quit Sumeshitter"
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
    case "p":
      const tweet = await tweet_wright()
      if (tweet.text == "q") {
        break
      }
      console.log("Tweet Text : " + tweet.text)
      const check = await checkOk()
      if (check.text == "y") {
        console.log("Tweeting...")
        await post(tweet.text)
      }
      break

    case "v":
      status.start()
      await tweetView()

      break

    case "q":
      console.log("Buy~")
      process.exit()
      break

    case "c":
      clear()
      console.log(chalk.blue(figlet.textSync("Sumeshitter", { horizontalLayout: "full" })))
      break

    default:
      console.log('"' + command.command + '" ' + "is Nothing... Retry")
  }
}

// ツイート閲覧　直近の20件+Limit
const tweetView = () => {
  return new Promise((resolve, reject) => {
    client.get("statuses/home_timeline", params, function(error, tweets, response) {
      if (!error) {
        var array = []
        var syan = "\u001b[36m"
        var reset = "\u001b[0m"
        tweets.forEach(function(json) {
          var day = new Date(json.created_at)
          day = day.getFullYear() + "/" + day.getMonth() + "/" + day.getDate() + "  " + day.getHours() + ":" + day.getMinutes() + ":" + day.getSeconds()
          array.push(syan + "⚡ " + json.user.name + "  :  " + "[" + day + "]" + "\n" + reset + json.full_text + "\n" + "\n" + "favorite:" + json.favorite_count + "     retweet:" + json.retweet_count)
        })

        array.reverse()
        status.stop()

        array.forEach(function(full_text) {
          console.log("\n--------------------------------------------------\n" + full_text)
        })

        console.log("\n")

        client.get("application/rate_limit_status.json", params, function(error, results, response) {
          if (!error) {
            console.log("[Rate-limits : " + results.resources.statuses["/statuses/home_timeline"].remaining + "]" + "\n")

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
      name: "text",
      type: "input",
      message: "Tweet",
      validate: function(value) {
        if (value.length) {
          return true
        } else {
          return "Quiet? -> q"
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
    client.post("statuses/update", { status: honbun }, function(error, tweet, response) {
      if (!error) {
        console.log("Done!")
        resolve()
      } else {
        console.log("error... : " + error)
      }
    })
  })
}

// okかどうかを問い合わせる y/n
const checkOk = async callback => {
  var tweet = [
    {
      name: "text",
      type: "input",
      message: "OK? y/n",
      validate: function(value) {
        if (value.length) {
          return true
        } else {
          return "Please Command y or n"
        }
      }
    }
  ]

  return await inquirer.prompt(tweet).then(callback)
}

if (module.parent) {
  module.exports = index
} else {
  index()
}
