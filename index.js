var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
// var GitHubApi   = require('rest');
var _           = require('lodash');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var files = require('./lib/files');

clear();
console.log(
  chalk.blue(
    figlet.textSync('Sumeshitter', { horizontalLayout: 'full' })
  )
);
