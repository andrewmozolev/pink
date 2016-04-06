'use strict';

var gulp         = require('gulp');
var sass         = require('gulp-sass');
var csscomb      = require('gulp-csscomb');
var plumber      = require('gulp-plumber');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var reporter     = require('postcss-reporter');
var syntax_scss  = require('postcss-scss');
var flexboxfixer = require('postcss-flexboxfixer')
var cssnano      = require('cssnano');
var mqpacker     = require('css-mqpacker');
var stylelint    = require('stylelint');
var sourcemaps   = require('gulp-sourcemaps');
var rename       = require('gulp-rename');
var gulpIf       = require('gulp-if');
var server       = require('browser-sync');
var notify       = require('gulp-notify');
var uglify       = require('gulp-uglify');
var svgSprite    = require('gulp-svg-sprite');
var fs           = require('fs'); // встроенный в node модуль, устанавливать не надо
var foldero      = require('foldero'); // плагин
var jade         = require('gulp-jade');
var imagemin     = require('gulp-imagemin')
var runSequence  = require('run-sequence');
var dataPath     = 'src/jade/_data'; // Где лежат файлы

var argv           = require('minimist')(process.argv.slice(2));

var path = require('path');

var isOnProduction = !!argv.production
var buildPath = isOnProduction ? 'build' : 'tmp';
var srcPath = 'src/';


/*=============================
=            PATHS            =
=============================*/

var paths = {
  build: {
    jade: 'build/',
    sass: 'build/css/',
    js: 'build/js/',
    svg: 'build/img/svg-sprite.svg',
    img: 'build/img/',
    fonts: 'build/fonts/'
  },
  src: {
    jade: 'src/jade/_pages/*.jade',
    sass: 'src/sass/style.scss',
    js: 'src/js/*.js',
    svg: 'src/img/svg-sprite/*.svg',
    img: ['!src/img/svg-sprite/*.*','src/img/**/*.*'],
    fonts: 'src/fonts/**/*.*'
  },
  watch: {
    jade: 'src/jade/**/*.*',
    sass: 'src/sass/**/*.{scss,sass}',
    js: 'src/js/**/*.js',
    svg: 'src/img/svg-sprite/**/*.svg',
    img: 'src/img/**/*.{jpg,png}',
    fonts: 'src/fonts/**/*.*'
  }
};

/*=====  End of PATHS  ======*/








/*=================================
=            Gulp JADE            =
=================================*/

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
  return gulp.src('**/*.jade', {cwd: path.join(srcPath, 'jade/_pages')})
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
  .pipe(gulp.dest(buildPath))
  .pipe(notify({
    message:'Jade complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=====  End of Gulp JADE  ======*/








/*=======================================
=            Gulp SVG-SPRITE            =
=======================================*/

gulp.task('svg', function() {
  return gulp.src('**/*.svg', {cwd: path.join(srcPath, 'img/svg-sprite')})
  .pipe(svgSprite({
    mode: {
      symbol: {
        dest: '.',
        dimensions: '%s',
        sprite: buildPath + '/img/svg-sprite.svg',
        example: false,
        render: {scss: {dest: 'src/sass/_global/svg-sprite.scss'}}
      }
    },
    svg: {
      xmlDeclaration: false,
      doctypeDeclaration: false
    }
  }))
  .pipe(gulp.dest('./'));
});

/*=====  End of Gulp SVG-SPRITE  ======*/








/*===================================
=            Gulp IMAGES            =
===================================*/

gulp.task('img', function() {
  return gulp.src(['!svg-sprite/*.*', '**/*.*'], {cwd: path.join(srcPath, 'img')})
  .pipe(imagemin({
    progressive: true
  }))
  .pipe(gulp.dest(buildPath + '/img'))
})

/*=====  End of Gulp IMAGES  ======*/








/*===============================
=            Gulp JS            =
===============================*/

gulp.task('js', function() {
  return gulp.src('**/*.js', {cwd: path.join(srcPath, 'js')})
  .pipe(plumber({
    errorHandler: notify.onError('Error: <%= error.message %>')
  }))
  .pipe(uglify())
  .pipe(gulp.dest(path.join(buildPath, 'js')))
  .pipe(notify({
    message:'JS complite: <%= file.relative %>!',
    sound: 'Pop'
  }))
});

/*=====  End of Gulp JS  ======*/








/* =================================
=            STYLETEST           =
================================= */

gulp.task('styletest', function() {
  var processors = [
    stylelint(),
    reporter({
      throwError: true
    })
  ];
  return gulp.src(['!src/sass/_global/svg-sprite.scss', 'src/sass/**/*.scss'])

  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(postcss(processors, {syntax: syntax_scss}))
});

/* =====  End of STYLETEST  ====== */








/*=================================
=            Gulp SASS            =
=================================*/

gulp.task('style', function() {
  return gulp.src('style.scss', {cwd: path.join(srcPath, 'sass')})
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([
    flexboxfixer,
    autoprefixer({browsers: [
      'last 1 version',
      'last 2 Chrome versions',
      'last 2 Firefox versions',
      'last 2 Opera versions',
      'last 2 Edge versions'
    ]}),
    cssnano({safe:true})
  ]))
  .pipe(rename('style.min.css'))
  .pipe(gulpIf(!isOnProduction, sourcemaps.write('./')))
  .pipe(gulp.dest(buildPath + '/css'))
  .pipe(server.stream())
  .pipe(notify({
    message:'SCSS complite: <%= file.relative %>!',
    sound: 'Pop'
  }))
});

/*=====  End of Gulp SASS  ======*/








/* ==================================
=            Gulp FONTS            =
================================== */

gulp.task('fonts', function() {
  return gulp.src('**/*.*', {cwd: path.join(srcPath, 'fonts')})
  .pipe(gulp.dest(buildPath + '/fonts'))
})

/* =====  End of Gulp FONTS  ====== */








/*==================================
=            Gulp SERVE            =
==================================*/

gulp.task('serve', function() {
  server.init({
    server: {
      baseDir: buildPath
    },
    notify: false,
    open: true,
    ui: false
  });
});

/*=====  End of Gulp SERVE  ======*/



gulp.task('build', function (callback) {
  runSequence(
    'svg',
    'jade',
    'js',
    'img',
    'fonts',
    'style',
    callback);
})




/* ===============================
=            DEFAULT            =
=============================== */

var allTasks = ['build']

if (!isOnProduction) {
  allTasks.push('serve');
}

gulp.task('default', allTasks, function() {
  if (!isOnProduction) {
    gulp.watch('**/*.scss', {cwd: path.join(srcPath, "sass")}, ['style', server.stream]);
    gulp.watch('**/*.jade', {cwd: path.join(srcPath, "jade")}, ['jade', server.reload]);
    gulp.watch('**/*.js', {cwd: path.join(srcPath, "js")}, ['js']);
    gulp.watch('**/*.*', {cwd: path.join(srcPath, "img/svg-sprite")}, ['svg']);
    gulp.watch('**/*.*', {cwd: path.join(srcPath, "img")}, ['img']);
    gulp.watch('**/*.*', {cwd: path.join(srcPath, "fonts")}, ['fonts']);
  }
})

/* =====  End of DEFAULT  ====== */
