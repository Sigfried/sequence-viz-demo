module.exports = {
    entry: './sequence-viz-demo.js',
    output: {
        path: './',
        filename: 'bundle.js',
    },
    resolve: {
        alias: { 
        },
        modulesDirectories: ['node_modules']
    },
    //devtool:"eval",
    devtool:"source-map",
    //watch: true,
    colors: true,
    progress: true,
    cache: true,
    debug: true
};
