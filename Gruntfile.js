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
        src: ['gen-js/Service.js', 'gen-js/*.js', 'src/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    shell: {
	DownloadThriftJS: {
            command: 'cd dist; curl -O https://raw.githubusercontent.com/apache/thrift/0.10.0/lib/js/src/thrift.js'
	},
	ThriftGen: {
            // TODO: Don't hardcode location of 'concrete-thrift' repo to '${HOME}/concrete/thrift'
            command: 'for P in `find ${HOME}/concrete/thrift -name "*.thrift"`; do thrift --gen js:jquery $P; done'
	}
    },
    qunit: {
    },
    jshint: {
      files: ['Gruntfile.js', 'gen-js/*.js', 'src/**/*.js', 'test/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    jsdoc: {
      dist: {
        src: ['src/*.js'],
        options: {
          access: 'all',
          configure: 'jsdoc.conf.json',
          destination: 'docs',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('test', ['shell:ThriftGen', 'jshint']);
  grunt.registerTask('default', ['shell:ThriftGen', 'jshint', 'concat', 'uglify', 'jsdoc']);
  grunt.registerTask('download', ['shell:DownloadThriftJS']);
};
