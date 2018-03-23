var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var autoprefixer = require('gulp-autoprefixer');
var autoprefixer_02 = require('autoprefixer');
let cleanCSS = require('gulp-clean-css');
var postcss = require('gulp-postcss');
// var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');
var minify = require('gulp-minifier');

var autoprefixerOptions = {
    browsers: ['last 2 versions', '> 0%', 'Firefox ESR', 'ie 9']
}

function errorLog(error) {
    console.error.bind(error);
    return;
}

gulp.task('sass', function () {
    return gulp.src('app/assets/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        // .pipe(cssnano())
        // .pipe(plumber())
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(cleanCSS())
        .on('error', errorLog)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/assets/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('js', function () {
    return gulp.src(['app/assets/js/**/*.js', '!app/assets/js/**/*.min.js'])
    .pipe(sourcemaps.init())
    .pipe(jshint())
    .pipe(jshint.reporter())
    .pipe(sourcemaps.write())
})

// gulp.task('css', function () {
//     var plugins = [
//         autoprefixer_02({browsers: ['last 1 version']}),
//         cssnano()
//     ];
//     return gulp.src('app/assets/css/**/*.css')
//         .pipe(postcss(plugins))
//         .pipe(gulp.dest('app/assets/css'));
// });

gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'app'
        },
    })
});

gulp.task('useref', function () {
    return gulp.src('app/*.html')
        .pipe(useref())
        // Minifies only if it's a JavaScript file
        .pipe(gulpIf('*.js', uglify()))
        // Minifies only if it's a CSS file
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulp.dest('dist'))
});

//Chúng ta có thể tối ưu hóa ảnh png, jpg, gif và thậm chí là svg với gulp-imagemin
gulp.task('images', function () {
    return gulp.src('app/assets/images/**/*.+(png|jpg|gif|svg)')
        // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
});

gulp.task('fonts', function () {
    return gulp.src('app/assets/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

// gulp.task('watch', ['browserSync', 'sass'], function () {
gulp.task('watch', function () {
    gulp.watch('app/assets/scss/**/*.scss', ['sass']);
    // Other 
    gulp.watch('app/*.html', browserSync.reload);
    gulp.watch('app/assets/js/**/*.js', browserSync.reload);
})

gulp.task('clean:dist', function () {
    return del.sync('dist');
})
/** 
 * Bây giờ Gulp sẽ xóa thư mục "dist"
bất kỳ khi nào lệnh gulp clean: dist chạy.
Chú ý: Chúng ta không cần lo lắng về việc xóa thư mục dist / images bởi vì gulp - cache đã lưu ảnh trên hệ thống local của bạn.
Để xóa cache trên hệ thống local, bạn có thể tạo một task tên là "cache:clear".
 */

gulp.task('cache:clear', function (callback) {
    return cache.clearAll(callback)
})

gulp.task('build', function (callback) {
    runSequence('clean:dist', ['sass', 'js', 'useref', 'images', 'fonts'],
        callback
    )
})

/**
 * Tại sao lại là default? Bởi vì khi bạn có một task tên là default, 
 * bạn có thể chạy nó đơn giản bằng cách nhập lệnh gulp trong command line.
 */
gulp.task('default', function (callback) {
    runSequence(['sass', 'js', 'browserSync'], 'watch',
        callback
    )
});

gulp.task('example', function() {
    return gulp.src(['app/assets/js/**/*.js', '!app/assets/js/**/*.min.js'])
    .pipe(minify({
      minify: true,
      minifyHTML: {
        collapseWhitespace: true,
        conservativeCollapse: true,
      },
      minifyJS: {
        sourceMap: true
      },
      minifyCSS: true,
      getKeptComment: function (content, filePath) {
          var m = content.match(/\/\*![\s\S]*?\*\//img);
          return m && m.join('\n') + '\n' || '';
      }
    })).pipe(gulp.dest('dist'));
  });