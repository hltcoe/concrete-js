//To build dist/concrete.js, run grunt at the command line in this directory.
//Prerequisites:
// Node Setup -   nodejs.org
// Grunt Setup -  npm install  //reads the ./package.json and installs project dependencies

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
            src: '*.js',
            dest: 'dist_nodejs/'
          },
          {
            expand: true,
            cwd: 'src_nodejs',
            src: '**/*.js',
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
        command: 'find ../concrete/thrift -name "*.thrift" -exec thrift --gen js:jquery {} \\;'
      },
      ThriftGen_nodejs: {
        // TODO: Don't hardcode location of 'concrete' repo
        command: 'find ../concrete/thrift -name "*.thrift" -exec thrift --gen js:node,es6 {} \\;'
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
      },
      src_nodejs: {
        src: [
          'examples/*.html',
          'Gruntfile.js',
          'gen-nodejs/*.js',
          'src_nodejs/**/*.js',
          'test_nodejs/**/*.js',
        ],
        options: {
          extract: 'auto',
          // options here to override JSHint defaults
          node: 'true',
          esversion: 6,
          "-W083": true,
        }
      },
    },
    jsdoc: {
      docs: {
        src: ['src_nodejs/*.js', 'README.md'],
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

  grunt.registerTask('docs', ['jsdoc:docs', 'jsdoc:docs/js-jquery', 'copy:docs']);
  grunt.registerTask('download', ['shell:DownloadThriftJS']);
  grunt.registerTask('js', ['shell:ThriftGen', 'jshint:src', 'concat:dist', 'uglify:dist', 'download']);
  grunt.registerTask('nodejs', ['shell:ThriftGen_nodejs', 'shell:VersionGen_nodejs', 'jshint:src_nodejs', 'copy:dist_nodejs']);
  grunt.registerTask('default', ['nodejs', 'js', 'docs']);
};
