module.exports = function() {
  // copy all test/ files
  this.fs.copy(
    this.templatePath('test/**'),
    this.destinationPath('test'), {
      ...this.props
    }
  );
}