/**
 * Created by noam on 11/24/15.
 */

// web framework that `atlassian-connect-express` uses
var express = require('express');

var ac = require('atlassian-connect-express-bitbucket');

// Static expiry middleware to help serve static resources efficiently
process.env.PWD = process.env.PWD || process.cwd(); // Fix expiry on Windows :(
var expiry = require('static-expiry');

var hbs = require('express-hbs');
var http = require('http');
var path = require('path');
var os = require('os');

var staticDir = path.join(__dirname, 'public');

var viewsDir = __dirname + '/views';

var routes = require('./routes');

var app = express();

var addon = ac(app);

var port = addon.config.port();

var devEnv = app.get('env') == 'development';

// The following settings applies to all environments
app.set('port', port);

// Configure the Handlebars view engine
app.engine('hbs', hbs.express3({partialsDir: viewsDir}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

app.use(express.favicon());
app.use(express.logger(devEnv ? 'dev' : 'default'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.compress());
app.use(addon.middleware());
app.use(expiry(app, {dir: staticDir, debug: devEnv}));
hbs.registerHelper('furl', function(url){ return app.locals.furl(url); });
app.use(app.router);
app.use(express.static(staticDir));

if (devEnv) app.use(express.errorHandler());

// Wire up your routes using the express and `atlassian-connect-express` objects
routes(app, addon);

// Boot
http.createServer(app).listen(port, function(){
    console.log('Add-on server running at http://' + os.hostname() + ':' + port);
    // Enables auto registration/de-registration of add-ons into a host in dev mode
    if (devEnv) addon.register();
});
