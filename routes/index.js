var util = require('util');

module.exports = function (app, addon) {

    app.get('/', function (req, res) {
        res.format({
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    app.get('/render-asciidoc-readme-repo', addon.authenticate(), function (mainRequest, mainResponse) {

        var httpClient = addon.httpClient(mainRequest);

        var repoChangeset = repoChangesetUrl(mainRequest.query.repoPath);
        httpClient.get(repoChangeset, function (changesetErr, changesetResponse, rawChangesetData) {
            var rev = latestRev(rawChangesetData);

            var repoFiles = repoFilesUrl(mainRequest.query.repoPath, rev);
            httpClient.get(repoFiles, function (filesErr, filesResponse, rawFilesData) {

                var readmeFilePath = readmePath(rawFilesData);
                if (readmeFilePath) {
                    var fileSrc = fileSrcUrl(mainRequest.query.repoPath, rev, readmeFilePath);
                    httpClient.get(fileSrc, function (readmeErr, readmeResponse, rawReadmeData) {
                        var readmeData = JSON.parse(rawReadmeData);
                        renderAsciiDoc(readmeData.data, mainResponse);
                    });
                } else {
                    mainResponse.render('no-asciidoc-readme')
                }
            });
        });
    });

    app.get('/render-asciidoc-file', addon.authenticate(), function (mainRequest, mainResponse) {
        var requestQuery = mainRequest.query;
        var repoPath = requestQuery.repoPath;
        var rev = requestQuery.rev;
        var filePath = requestQuery.filePath;

        var httpClient = addon.httpClient(mainRequest);

        var fileSrc = fileSrcUrl(repoPath, rev, filePath);
        httpClient.get(fileSrc, function (err, response, data) {
            var fileData = JSON.parse(data);
            renderAsciiDoc(fileData.data, mainResponse);
        });
    });

    function latestRev(rawChangesetData) {
        var changesetData = JSON.parse(rawChangesetData);
        return changesetData.changesets[0].raw_node;
    }

    function repoChangesetUrl(repoPath) {
        return '/api/1.0/repositories/' + repoPath + '/changesets?limit=1'
    }

    function repoFilesUrl(repoPath, rev) {
        return '/api/1.0/repositories/' + repoPath + '/src/' + rev + '/'
    }

    function readmePath(rawFilesData) {
        var filesData = JSON.parse(rawFilesData);
        var files = filesData.files;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (endsWith(file.path, 'readme.asciidoc') || endsWith(file.path, 'readme.adoc')) {

                return file.path;
            }
        }

        return null
    }

    function fileSrcUrl(repoPath, rev, filePath) {
        return '/api/1.0/repositories/' + repoPath + '/src/' + rev + '/' + filePath
    }

    function renderAsciiDoc(content, response) {
        var asciidoctor = require('asciidoctor.js')();
        var opal = asciidoctor.Opal;

        var processor = asciidoctor.Asciidoctor(true);

        var options = opal.hash2(
            ['attributes'],
            {attributes: ['showtitle']}
        );
        var html = processor.$convert(content, options);

        response.render('render-asciidoc', {
            content: html
        });
    }

    function endsWith(str, suffix) {
        return str.toLowerCase().indexOf(suffix.toLocaleLowerCase(), str.length - suffix.length) !== -1;
    }
};
