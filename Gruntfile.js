//To build dist/concrete.js, run grunt at the command line in this directory.
//Prerequisites:
// Node Setup -   nodejs.org
// Grunt Setup -  npm install  //reads the ./package.json and installs project dependencies

module.exports = function(grunt) {
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
          }
        ]
      }
    },
    shell: {
	DownloadThriftJS: {
            command: 'cd dist; curl https://raw.githubusercontent.com/apache/thrift/0.12.0/lib/js/src/thrift.js --output thrift.js'
	},
	ThriftGen: {
            // TODO: Don't hardcode location of 'concrete-thrift' repo to '${HOME}/concrete/thrift'
            command: 'for P in `find ${HOME}/concrete/thrift -name "*.thrift"`; do thrift --gen js:jquery $P; done'
	},
	ThriftGen_nodejs: {
            // TODO: Don't hardcode location of 'concrete-thrift' repo to '${HOME}/concrete/thrift'
            command: 'for P in `find ${HOME}/concrete/thrift -name "*.thrift"`; do thrift --gen js:node,es6 $P; done'
	}
    },
    qunit: {
      dist: {
      }
    },
    jshint: {
      dist: {
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
          }
        }
      },
      dist_nodejs: {
        src: [
          'examples/*.html',
          'Gruntfile.js',
          'gen-nodejs/*.js',
          'src_nodejs/**/*.js',
        ],
        options: {
          extract: 'auto',
          // options here to override JSHint defaults
          node: 'true',
          esversion: 6
        }
      },
    },
    jsdoc: {
      docs: {
        src: ['src/*.js', 'README-js.md'],
        options: {
          access: 'all',
          configure: 'jsdoc.conf.json',
          destination: 'docs',
          template: 'node_modules/docdash',
        },
      },
      docs_nodejs: {
        src: ['src_nodejs/*.js', 'README-nodejs.md'],
        options: {
          access: 'all',
          configure: 'jsdoc.conf.json',
          destination: 'docs_nodejs',
          template: 'node_modules/docdash',
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

  grunt.registerTask('test', ['shell:ThriftGen', 'jshint:dist']);
  grunt.registerTask('default', ['shell:ThriftGen', 'jshint:dist', 'concat:dist', 'uglify:dist', 'jsdoc:docs']);
  grunt.registerTask('download', ['shell:DownloadThriftJS']);
  grunt.registerTask('nodejs', ['shell:ThriftGen_nodejs', 'jshint:dist_nodejs', 'copy:dist_nodejs', 'jsdoc:docs_nodejs']);
};
