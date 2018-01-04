'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
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
    this.fs.copyTpl(
      this.templatePath('package.json'),
      this.destinationPath('package.json'), {
          name: this.props.name,
          description: this.props.description
      });
  }

  install() {
    // this.installDependencies();
  }
};
