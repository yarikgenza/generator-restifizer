module.exports = function() {
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