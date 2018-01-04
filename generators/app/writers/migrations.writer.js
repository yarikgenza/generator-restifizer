module.exports = function() {
  // copy all migrations/ files
  this.fs.copy(
    this.templatePath('migrations/**'),
    this.destinationPath('migrations'), {
      ...this.props
    }
  );
}