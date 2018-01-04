'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

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
    });
  }

  writing() {

    const rootFiles = [
      'package.json',
      'server.js',
      'runner.js',
      'README.md',
      'newrelic.js',
      'migrate-db.js',
      'gulpfile.js',
      'apidoc.json',
      '.gitlab-ci.yml',
      '.gitignore',
      '.eslintrc.js',
      '.eslintignore',
    ];

    rootFiles.forEach((path) => {
      this.fs.copyTpl(
        this.templatePath(path),
        this.destinationPath(path), {
          ...this.props
        }
      )
    });
  }

  install() {
    // this.installDependencies();
  }
};
