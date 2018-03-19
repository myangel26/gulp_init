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

gulp.task('sass', function () {
    return gulp.src('app/assets/scss/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('app/assets/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

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
    runSequence('clean:dist', ['sass', 'useref', 'images', 'fonts'],
        callback
    )
})

/**
 * Tại sao lại là default? Bởi vì khi bạn có một task tên là default, 
 * bạn có thể chạy nó đơn giản bằng cách nhập lệnh gulp trong command line.
 */
gulp.task('default', function (callback) {
    runSequence(['sass', 'browserSync'], 'watch',
        callback
    )
})