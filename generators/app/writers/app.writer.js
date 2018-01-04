module.exports = function() {
  // copy all app/ files
  this.fs.copy(
    this.templatePath('app/**'),
    this.destinationPath('app'), {
      ...this.props
    }
  );
}