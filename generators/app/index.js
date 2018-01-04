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
  async prompting() {

    const mergeProps = (data) => {
      this.props = Object.assign(this.props, data);
    }

    this.log(yosay(`Welcome to ${chalk.red('restifizer')} generator!`));
    this.log(chalk.red('Let me know a bit more about you new project ;)\n'));

    /* General project infogration */
    const infoPrompts = [{
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
    this.props = await this.prompt(infoPrompts);

    /* Transport conf. TO-DO: write the appropriate conditions to the template */
    this.log(chalk.red(`\nOk. Now let's configure restifizer for ${this.props.name}\n`));

    const rfProps = await this.prompt({
      type: 'confirm',
      name: 'addSocket',
      message: 'Restifizer comes with Express transport by default. Would you like to add socket.io additionaly?',
      default: false,
    });
    mergeProps(rfProps);

    /* Auth plugin conf.  TO-DO: write the appropriate conditions to the template */
    const authProps = await this.prompt({
      type: 'confirm',
      name: 'useSNAuth',
      message: 'Should I configure auth with social networks?',
      default: true,
    })
    mergeProps(authProps);

    /* Get a list of SN to integrate TO-DO: write the appropriate conditions to the template */
    if (this.props.useSNAuth) {
      const SNAuthProps = await this.prompt({
        type: 'checkbox',
        name: 'snList',
        choices: ['facebook', 'google', 'vk'],
        message: 'Select social networks which you need to integrate',
        default: ['facebook']
      });
      mergeProps(SNAuthProps);
    }

    /* i18n TO-DO: write the appropriate conditions to the template */
    const i18nProps = await this.prompt({
      type: 'confirm',
      name: 'add_i18n',
      message: 'Would you like to include i18n?',
      default: true,
    })
    mergeProps(i18nProps);

    if (this.props.add_i18n) {
      const defaultLocale = await this.prompt({
        type: 'input',
        name: 'defaultLocale',
        message: 'Type a default locale to use',
        default: 'en',
      });
      mergeProps(defaultLocale);
    }
  }

  writing() {
    this.log(chalk.red(`\nAll right! Now I will generate required files (press ${chalk.yellow('Ctrl + C to abort')})\n`));
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

  end() {
    this.log(chalk.red(`\nOk, now everything is ${chalk.green('ready')} to start writing code. Good luck!`));
    this.log(yosay(`Don't forget to migrate test-db!`))
  }
};
