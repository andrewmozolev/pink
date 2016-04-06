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
var cssnano      = require('gulp-cssnano');
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

var dataPath     = 'src/jade/_data'; // Где лежат файлы

var argv           = require('minimist')(process.argv.slice(2));
var isOnProduction = !!argv.production


/*=============================
=            Paths            =
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

/*=====  End of Paths  ======*/








/*=================================
=            Gulp Jade            =
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
    message:'Jade complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=====  End of Gulp Jade  ======*/








/*=======================================
=            Gulp SVG-Sprite            =
=======================================*/

gulp.task('svg', function() {
  return gulp.src(paths.src.svg)
  .pipe(svgSprite({
    mode: {
      symbol: {
        dest: '.',
        dimensions: '%s',
        sprite: paths.build.svg,
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

/*=====  End of Gulp SVG-Sprite  ======*/








/*===================================
=            Gulp Images            =
===================================*/

gulp.task('images', function() {
  return gulp.src(paths.src.img)
  .pipe(gulp.dest(paths.build.img))
})

/*=====  End of Gulp Images  ======*/








/*===============================
=            Gulp JS            =
===============================*/

gulp.task('js', function() {
  gulp.src(paths.src.js)
  .pipe(plumber({
    errorHandler: notify.onError('Error: <%= error.message %>')
  }))
  .pipe(uglify())
  .pipe(gulp.dest(paths.build.js))
  .pipe(notify({
    message:'JS complite: <%= file.relative %>!',
    sound: 'Pop'
  }))
});

/*=====  End of Gulp JS  ======*/






/*=================================
=            Gulp Sass            =
=================================*/

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


gulp.task('style',['styletest'], function() {
  return gulp.src(paths.src.sass)
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(postcss([
    flexboxfixer,
    autoprefixer({browsers: [
      'last 1 version',
      'last 2 Chrome versions',
      'last 2 Firefox versions',
      'last 2 Opera versions',
      'last 2 Edge versions'
    ]})
  ]))
  .pipe(csscomb())
  .pipe(gulpIf(!isOnProduction, sourcemaps.write()))
  .pipe(gulp.dest(paths.build.sass))
  .pipe(cssnano({safe:true}))
  .pipe(rename('style.min.css'))
  .pipe(gulp.dest(paths.build.sass))
  .pipe(server.stream())
  .pipe(notify({
    message:'SCSS complite: <%= file.relative %>!',
    sound: 'Pop'
  }))
});

/*=====  End of Gulp Sass  ======*/








/* ==================================
=            Gulp Fonts            =
================================== */

gulp.task('fonts', function() {
  return gulp.src(paths.src.fonts)
  .pipe(gulp.dest(paths.build.fonts))
})

/* =====  End of Gulp Fonts  ====== */








/*==================================
=            Gulp Serve            =
==================================*/

gulp.task('serve', ['style','jade','js','svg','images','fonts'], function() {
  server.init({
    server: {
      baseDir: paths.build.jade
    },
    notify: false,
    open: true,
    ui: false
  });

  gulp.watch(paths.watch.sass, ['style', server.stream]);
  gulp.watch(paths.watch.jade, ['jade', server.reload]);
  gulp.watch(paths.watch.js, ['js']);
  gulp.watch(paths.watch.svg, ['svg']);
  gulp.watch(paths.watch.img, ['images']);
  gulp.watch(paths.watch.fonts, ['fonts']);
});

/*=====  End of Gulp Serve  ======*/
