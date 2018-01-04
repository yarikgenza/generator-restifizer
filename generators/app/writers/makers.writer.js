module.exports = function() {
  // copy all makers/ files
  this.fs.copy(
    this.templatePath('makers/**'),
    this.destinationPath('makers'), {
      ...this.props
    }
  );
}