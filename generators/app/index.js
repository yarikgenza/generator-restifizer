'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

// Import file writers
const rootWriter = require('./writers/root.writer');

module.exports = class extends Generator {
  prompting() {

    this.log(yosay(`Welcome to ${chalk.red('restifizer')} generator!`));

    const prompts = [{
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      default: 'restifizer-app',
    },{
      type: 'input',
      name: 'description',
      message: 'What is your project description?',
      default: 'restifizer-app',
    }];

    return this.prompt(prompts).then(props => {
      this.props = props;
    })
  }

  writing() {
    rootWriter.call(this);
  }

  install() {
    // this.installDependencies();
  }
};
