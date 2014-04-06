var lcovParse = require('lcov-parse');
var path = require('path');
var fs = require('fs');
var pjson = require('./package.json');
var git  = require("./git_info");
var ci  = require("./ci_info");

function Formatter(options) {
  this.options = options || {};
}

Formatter.prototype.rootDirectory = function() {
  return this.options.rootDirectory || process.cwd();
}

Formatter.prototype.format = function(lcovData, callback) {
  var self = this;
  lcovParse(lcovData, function(err, data) {
    result = {
      source_files: self.sourceFiles(data),
      run_at: Date.now(),
      partial: false,
      environment: {
        pwd: process.cwd(),
        package_version: pjson.version
      },
      ci_service: ci.getInfo(),
      git: self.gitGitInfo()
    }
    callback(err, result);
  });
}

Formatter.prototype.sourceFiles = function(data) {
  var source_files = [];
  var self = this;
  data.forEach(function(elem, index) {
    var content = fs.readFileSync(elem.file).toString();
    var numLines = content.split("\n").size

    var coverage = new Array(numLines);
    coverage.forEach(function(elem, index, arr) {
      arr[index] = null;
    });
    elem.lines.details.forEach(function(lineDetail) {
      coverage[lineDetail.line - 1] = lineDetail.hit
    });

    var fileName = path.relative(self.rootDirectory(), elem.file);

    source_files.push({
      name: fileName,
      blob_id: git.calculateBlobId(content),
      coverage: JSON.stringify(coverage)
    });
  });
  return source_files;
}

Formatter.prototype.gitGitInfo = function() {
  return {
    head: git.head(),
    committed_at: git.committedAt(),
    branch: git.branch()
  };
}

module.exports = Formatter;
