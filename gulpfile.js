const gulp = require("gulp");
const del = require("del");
const concat = require("gulp-concat");
const clean_css = require("gulp-clean-css");
const flatten = require("gulp-flatten");
const uglify = require("gulp-uglify");
const run_sequence = require("gulp4-run-sequence");

gulp.task("build", async function () {
    run_sequence("clean", "clean_css", "copy_fonts", "uglify_js");
});

gulp.task("clean", function () {
    return del.deleteAsync(["public/**", "!public"]);
});

gulp.task("clean_css", function () {
    return gulp.src("static/src/**/*.css")
        .pipe(gulp.src("static/css/*.css"))
        .pipe(concat("dist.css"))
        .pipe(clean_css())
        .pipe(gulp.dest("public/"));
});

gulp.task("copy_fonts", function () {
    return gulp.src("static/src/**/bootstrap-icons.woff2", { encoding: false })
        .pipe(flatten())
        .pipe(gulp.dest("public/fonts/"));
});

gulp.task("uglify_js", function () {
    return gulp.src("static/src/**/*.js")
        .pipe(gulp.src("static/js/*.js"))
        .pipe(concat("dist.js"))
        .pipe(uglify())
        .pipe(gulp.dest("public/"));
});
