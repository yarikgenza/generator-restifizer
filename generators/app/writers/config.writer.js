module.exports = function() {
  // copy all config/ files
  this.fs.copyTpl(
    this.templatePath('config/**'),
    this.destinationPath('config'), {
      ...this.props
    }
  );
}