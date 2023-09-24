//To build dist/concrete.js, run grunt at the command line in this directory.
//Prerequisites:
// Node Setup -   nodejs.org
// Grunt Setup -  npm install  //reads the ./package.json and installs project dependencies

module.exports = function (grunt) {
  'use strict';

  var thriftPaths = grunt.file.expand({filter: "isFile"}, ["../concrete/thrift/**/*.thrift"]);
  var pkg = grunt.file.readJSON('package.json');
  var isFinalVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/.test(pkg.version);

  function createDocsIndex() {
    var latestDocsPath = pkg.name + '/' + pkg.version;
    grunt.file.write('docs/index.html', [
      '<!DOCTYPE html>',
      '<html>',
      '  <head>',
      '    <title>Redirecting to the latest concrete-js documentation ...</title>',
      '    <meta http-equiv="Refresh" content="0; url=\'' + latestDocsPath + '\'" />',
      '  </head>',
      '  <body>',
      '    <p>',
      '      Redirecting to <a href="' + latestDocsPath + '">the latest concrete-js documentation</a> ...',
      '    </p>',
      '  </body>',
      '</html>',
    ].join('\n'));
  }

  function addNodeJSDocstrings() {
    var generatedTypesPaths = grunt.file.expand({filter: "isFile"}, ["gen-nodejs/**/*_types.js"]);
    generatedTypesPaths.forEach(function (path) {
      var ns = 'concrete.' + path.match(/^.+\/(\w+)_types.js$/)[1];
      grunt.file.write(
        path,
        grunt.file.read(path)
          .replace(
            /^/,
            function(match) {
              return [
                '/**',
                ' * @namespace ' + ns,
                ' */',
                ''
              ].join('\n');
            }
          )
          .replaceAll(
            // Use a strict regex to reduce chance of false positives
            /^const (\w+) = module\.exports\.\w+ = class \{\s*$/gm,
            function(match, p1) {
              return [
                '',
                '/**',
                ' * @memberof ' + ns,
                ' * @class ' + p1,
                ' * @classdesc ' + p1 + ' class generated by Thrift',
                ' */',
                match
              ].join('\n');
            }
          )
      );
    });
  }

  grunt.initConfig({
    pkg: pkg,
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          // Services is used by other files in gen-js/
          'gen-js/Service.js',
          'gen-js/*.js',

          // concrete.util is used by other files in src/
          'src/util.js',
          'src/*.js'
        ],
        dest: 'dist/concrete.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! concrete <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/concrete.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    copy: {
      dist_nodejs: {
        files: [
          {
            expand: true,
            cwd: 'gen-nodejs',
            src: ['*.js', '*.ts'],
            dest: 'dist_nodejs/'
          },
          {
            expand: true,
            cwd: 'src_nodejs',
            src: ['**/*.js', '**/*.ts'],
            dest: 'dist_nodejs/'
          },
          {
            src: 'LICENSE.txt',
            dest: 'dist_nodejs/'
          },
          {
            src: 'package.json',
            dest: 'dist_nodejs/',
          },
          {
            src: 'README.md',
            dest: 'dist_nodejs/'
          }
        ]
      },
      docs: {
        files: [
          {
            expand: true,
            cwd: 'dist',
            src: '*.js',
            dest: 'docs/'
          }
        ]
      },
      options: {
        mode: true,
      },
    },
    shell: {
      DownloadThriftJS: {
        command: 'curl https://raw.githubusercontent.com/apache/thrift/0.16.0/lib/js/src/thrift.js --output dist/thrift.js'
      },
      ThriftGen: {
        // TODO: Don't hardcode location of 'concrete' repo
        command: thriftPaths.map(function(path) {return 'thrift --gen js:jquery ' + path;}).join(' && '),
      },
      ThriftGen_nodejs: {
        // TODO: Don't hardcode location of 'concrete' repo
        command: thriftPaths.map(function(path) {return 'thrift --gen js:node,es6,ts ' + path;}).join(' && '),
      },
      VersionGen_nodejs: {
        command: 'genversion --semi src_nodejs/generated_version.js'
      },
    },
    qunit: {
      dist: {
      }
    },
    jshint: {
      src: {
        src: [
          'examples/*.html',
          'Gruntfile.js',
          'gen-js/*.js',
          'src/**/*.js',
          'test/unit/*.js',
          'test/integration/*.js'
        ],
        options: {
          extract: 'auto',
          // options here to override JSHint defaults
          globals: {
            jQuery: true,
            console: true,
            module: true,
            document: true
          },
          "-W083": true,
        }
      }
    },
    eslint: {
      target: [
        'gen-nodejs/**/*.js',
        'gen-nodejs/**/*.ts',
        'src_nodejs/**/*.js',
        'src_nodejs/**/*.ts',
        'test_nodejs/**/*.js',
        'test_nodejs/**/*.ts'
      ]
    },
    jsdoc: {
      docs: {
        src: ['src_nodejs/**/*.js', 'gen-nodejs/**/*.js', 'README.md', 'package.json'],
        options: {
          configure: 'jsdoc.conf.json',
          destination: 'docs',
        },
      },
      "docs/js-jquery": {
        src: ['src/*.js', 'README-js-jquery.md'],
        options: {
          configure: 'jsdoc.conf.json',
          destination: 'docs/js-jquery',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('addNodeJSDocstrings', 'Add docstrings to thrift-generated Node.js code', addNodeJSDocstrings);
  grunt.registerTask('createDocsIndex', 'Creates documentation index', createDocsIndex);
  grunt.registerTask('docs', [
    'jsdoc:docs', 'jsdoc:docs/js-jquery', 'copy:docs'
  ].concat(isFinalVersion ? ['createDocsIndex'] : []));
  grunt.registerTask('download', ['shell:DownloadThriftJS']);
  grunt.registerTask('js', ['shell:ThriftGen', 'jshint:src', 'concat:dist', 'uglify:dist', 'download']);
  grunt.registerTask('nodejs', [
    'shell:ThriftGen_nodejs', 'addNodeJSDocstrings', 'shell:VersionGen_nodejs', 'eslint', 'copy:dist_nodejs'
  ]);
  grunt.registerTask('default', ['nodejs', 'js', 'docs']);
};
