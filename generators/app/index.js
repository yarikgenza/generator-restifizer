'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

// Import file writers
const rootWriter = require('./writers/root.writer');
const apidocsWriter = require('./writers/apidocs.writer');
const configWriter = require('./writers/config.writer');
const makersWriter = require('./writers/makers.writer');
const testWriter = require('./writers/test.writer');
const migrationsWriter = require('./writers/migrations.writer');
const appWriter = require('./writers/app.writer');

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
    apidocsWriter.call(this);
    configWriter.call(this);
    makersWriter.call(this);
    testWriter.call(this);
    migrationsWriter.call(this);
    appWriter.call(this);
  }

  install() {
    this.installDependencies({
      npm: true,
      bower: false,
      yarn: false,
    });
  }
};
