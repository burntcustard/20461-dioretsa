const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const fs = require('fs');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const JSZip = require('jszip');
const terser = require('terser');
const pp = require('preprocess');

// Enabled/Disables browserSync live reloading rather than just building once
const DEVMODE = process.argv.slice(2).includes('--watch');

// Enables/Disables DEBUG mode in Kontra
const DEBUG = process.argv.slice(2).includes('--debug');

// Enables/Disables visual debugging in Kontra
const VISUAL_DEBUG = process.argv.slice(2).includes('--visual-debug');

/**
 * Formats a duration number (ms) into a nice looking string with ansi-colors
 * @param  {number} duration Duration in milliseconds
 * @return {string}          Nicely formatted color string
 */
function formatMs(duration) {
    return c.magentaBright(duration.toString().padStart(4, ' ') + ' ms');
}

/**
 * Console logs a duration (in milliseconds), a fancy arrow char, and a string
 * @param  {number} duration   [description]
 * @param  {string} outputFile [description]
 */
function logOutput(duration, outputFile) {
    console.log(`${formatMs(duration)} ↪ ${outputFile}`);
}

/**
 * Based off rollup-cli error printing
 * https://github.com/rollup/rollup/blob/master/cli/logging.ts
 * @param {object} error
 */
function printRollupError(error) {
    let description = error.message || error;

    if (error.name) {
        description = `${error.name}: ${description}`;
    }

    console.error(c.bold.red(`[!] ${description}`));

    if (error.loc) {
        const path = error.loc.file.replace(process.cwd(), '');
		console.error(`${path} ${error.loc.line}:${error.loc.column}`);
	}

    if (error.frame) {
		console.error(c.gray(error.frame));
	}
}

const compile = async () => {
    const config = {
        input: 'src/js/main.js',
        output: {
            file: 'dist/main.js',
            format: 'iife',
            sourcemap: DEVMODE
        }
    }

    if (DEVMODE) {
        const watcher = rollup.watch({
            input: config.input,
            output: [ config.output ],
            watch: {
              include: 'src/**/*'
            },
            plugins: [ resolve() ]
        });

        watcher.on('event', event => {
            switch (event.code) {
                case 'START':
                    console.log(`Building JS from ${config.input}...`);
                    break;
                case 'BUNDLE_END':
                    logOutput(event.duration, config.output.file);
                    break;
                case 'END':
                    inline(minify()) && livereload() && zip();
                    break;
                case 'ERROR':
                case 'FATAL':
                    printRollupError(event.error);
                    break;
            }
        });
    } else {
        const startTime = Date.now();
        console.log(`Building JS from ${config.input}...`);

        rollup.rollup({
                 input: config.input,
                 output: [ config.output ],
                 plugins: [ resolve() ]
              })
              .then(async (bundle) => {
                  await bundle.write(config.output);
                  logOutput(Date.now() - startTime, config.output.file);
                  inline(minify()) && zip();
              })
              .catch(error => {
                  printRollupError(error);
              });
    }
}

/**
 * Minify the JS bundle. Includes using preprocess to remove debug messages.
 * @return {object} Output code from terser.minify
 */
function minify() {
    const startTime = Date.now();
    const options = {
        compress: {
            passes: 2,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_math: true,
            // unsafe_proto: true, // ~ 3 bytes
            booleans_as_integers: true // ~ 20 bytes if really needed
        },
        mangle: {
            properties: {
                keep_quoted: true,
                reserved: [ 'game' ],
            }
        },
        module: true,
        sourceMap: DEVMODE ? {
            content: fs.readFileSync('dist/main.js.map', 'utf8'),
            url: 'main.min.js.map'
        } : false
    };

    console.log('Minifying JS...');

    let code = fs.readFileSync('dist/main.js', 'utf8');

    // Replace Kontra's debug stuff
    code = pp.preprocess(code, { DEBUG, VISUAL_DEBUG }, { type: 'js' });

    // Remove Collisions debug stuff
    code = code.replace(/if.*[\s]*throw.*Error.*[\s]*}/g, '');

    // Shorten some very specific names from the pre-minified code.
    // These are 'reused' strings from elsewhere in the code to compress better
    code = code.replace(/'bullet'/g, '0');
    code = code.replace(/'meteor'/g, '1');
    code = code.replace(/'pickup'/g, '2');
    code = code.replace(/'ship'/g, '3');
    code = code.replace(/'shrapnel'/g, '4');

    // Replace some "terser reserved words" from source before minifying
    // These are VERY LIKELY to break things
    code = code.replace(/acceleration/g, '_acceleration');
    code = code.replace(/detail/g, '_detail');
    code = code.replace(/focus/g, '_focus');
    code = code.replace(/history/g, '_history');
    code = code.replace(/update/g, '_update');
    code = code.replace(/controls/g, '_controls');
    code = code.replace(/position/g, '_position');
    code = code.replace(/padding/g, '_padding');
    code = code.replace(/rotation/g, '_rotation');
    code = code.replace(/color/g, '_color');
    code = code.replace(/angle/g, '_angle');
    code = code.replace(/accept/g, '_accept');

    const result = terser.minify(code, options);

    if (result.error) {
        console.error('Terser minify failed: ', result.error.message);
        return false;
    }

    // Remove a bit of dead Kontra init code
    result.code = result.code.replace('document.getElementById(void 0)||', '');

    // Pull the last semi-colon.
    // No longer used as whole function wrapper removed instead
    // result.code = result.code.replace(/;$/, '');

    // Don't wrap the game in a function
    // The 2nd replace doesn't use $, in case the closing tag isn't at the end.
    // - That does make it risky, as those chars might be somewhere else too.
    result.code = result.code.replace(/^\!function\(\){/, '');
    result.code = result.code.replace(/}\(\);/, '');

    fs.writeFileSync('dist/main.min.js', result.code);
    if (result.map) {
        fs.writeFileSync('dist/main.min.js.map', result.map);
    }

    //fs.writeFileSync('cacheFile', JSON.stringify(options.nameCache), "utf8");

    logOutput(Date.now() - startTime, 'dist/main.min.js');

    return result.code;
}

function inline(minifiedJS) {
    var startTime = Date.now();

    console.log('Inlining JS...');

    const html = fs.readFileSync('src/index.html', 'utf8');

    fs.writeFileSync(
        'dist/index.html',
        // Prepend <body> so browsersync can insert its script in dev mode
        `${html}<script>${minifiedJS}</script>`
    );

    logOutput(Date.now() - startTime, 'dist/index.html');

    return true;
}

/**
 * Draw a fancy zip file size bar with KB and % values
 * @param  {number} used Size of zip file in bytes
 */
function drawSize(used) {
    const limit = 13312; // 13KB (not kB!)
    const remaining = limit - used;
    const usedPercent = Math.round((100 / limit) * used);
    const barWidth = process.stdout.columns - 26;
    const usedBarWidth = Math.round((barWidth / 100) * usedPercent);
    const usedStr = (used + ' B').padStart(7, ' ');
    const limitStr = ((limit / 1024).toFixed(0) + ' KB').padEnd(5, ' ');

    var output = usedStr + ' / ' + limitStr +  ' [';
    for (let i = 0; i < barWidth; i++) {
        output += `${i < usedBarWidth ? '#' : c.gray('-')}`;
    }
    output += '] ';
    output += usedPercent > 99 ? c.red(usedPercent + '%') : usedPercent + '%';

    console.log(output);
}

function zip() {
    const startTime = Date.now();

    console.log('Zipping...');

    var zip = new JSZip();
    var data = fs.readFileSync('dist/index.html', 'utf8')
                 .replace('//# sourceMappingURL=main.min.js.map', '')
                 .replace('<body>', '');

    zip.file(
        'index.html',
        data,
        {
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9
            }
        }
    );

    zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
       .pipe(fs.createWriteStream('dist/main.zip'))
       .on('finish', function() {
           logOutput(Date.now() - startTime, 'dist/main.zip');
           drawSize(fs.statSync('dist/main.zip').size);
           return true;
       });
}

let livereload = () => {
  // On first run, start a web server
  browserSync.init({
    server: 'dist'
  });

  // On future runs, reload the browser
  livereload = () => {
    browserSync.reload('dist/index.html');
    return true;
  }

  return true;
};

compile();
