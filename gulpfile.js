'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var csscomb = require('gulp-csscomb');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var reporter     = require('postcss-reporter');
var syntax_scss  = require('postcss-scss');
var stylelint    = require('stylelint');
var server = require('browser-sync');
var notify = require('gulp-notify');

var fs = require('fs'); // встроенный в node модуль, устанавливать не надо
var foldero = require('foldero'); // плагин
// var jade = require('jade');
var jade = require('gulp-jade');

// где лежат файлы
var dataPath = 'jade/_data';


// paths
var paths = {
  build: {
    jade: 'build/',
    sass: 'build/css/'
  },
  src: {
    jade: 'jade/_pages/*.jade',
    sass: 'sass/style.scss'
  },
  watch: {
    jade: 'jade/**/*.*',
    sass: 'sass/**/*.{scss,sass}'
  }
};


gulp.task('jade', function() {
  // в этой переменной копим данные
  var siteData = {};

  // проверяем, есть ли по заданному пути папка
  if (fs.existsSync(dataPath)) {

    // берем и пишем в siteData
    siteData = foldero(dataPath, {
      recurse: true,
      whitelist: '(.*/)*.+\.(json)$', //... все json файлы
      // так обрабатываем каждый файл:
      loader: function loadAsString(file) {
        var json = {}; // сюда будем писать значения
        // пробуем извлечь из файла json
        try {
          json = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        // ругаемся, если в файле лежит плохой json
        catch(e) {
          console.log('Error Parsing JSON file: ' + file);
          console.log('==== Details Below ====');
          console.log(e);
        }
        // а если все ок, то добавляем его в siteData
        return json;
      }
    });
  }

  // только тут начался галп
  return gulp.src(paths.src.jade)
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))

  .pipe(jade({
    locals: {
      site: {
        data: siteData // переменные будут доступны в site.data
      }
    },
    pretty: true
  }))
  .pipe(gulp.dest(paths.build.jade))
  .pipe(notify({
    message:'jade up!',
    sound: 'Pop'
  }));
});


gulp.task("styletest", function() {
  var processors = [
    stylelint(),
    reporter({
      throwError: true
    })
  ];

  return gulp.src(['sass/**/*.scss'])
    .pipe(plumber())
    .pipe(postcss(processors, {syntax: syntax_scss}))
});

gulp.task('style',["styletest"], function() {
  gulp.src(paths.src.sass)
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(sass())
  .pipe(postcss([
    autoprefixer({browsers: [
      'last 1 version',
      'last 2 Chrome versions',
      'last 2 Firefox versions',
      'last 2 Opera versions',
      'last 2 Edge versions'
      ]})
    ]))
  .pipe(csscomb())
  .pipe(gulp.dest(paths.build.sass))
  .pipe(server.reload({stream: true}))
  .pipe(notify({
    message:'jade up!',
    sound: 'Pop'
  }));
});


gulp.task('serve', ['style','jade'], function() {
  server.init({
    server: {
      baseDir: paths.build.jade
    },
    notify: false,
    open: true,
    ui: false
  });

  gulp.watch(paths.watch.sass, ['style']);
  gulp.watch(paths.watch.jade, ['jade', server.reload]);
});
