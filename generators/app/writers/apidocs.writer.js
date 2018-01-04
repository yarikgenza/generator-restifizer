module.exports = function() {
  // copy all apidocs/ files
  this.fs.copy(
    this.templatePath('apidocs/**'),
    this.destinationPath('apidocs'), {
      ...this.props
    }
  );
}